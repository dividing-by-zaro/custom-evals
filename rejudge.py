#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import glob
import json
import logging
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

from src.config import get_judge_config, get_provider_config, load_config
from src.judge import judge_response
from src.models import (
    CriterionResult,
    EvalRun,
    ItemResult,
    JudgeSnapshot,
    RunSummary,
    DomainSummary,
)
from src.schema import load_eval_items

logger = logging.getLogger(__name__)


def _build_summary(items: list[ItemResult]) -> RunSummary:
    scored_items = [i for i in items if i.status == "scored"]
    total_score = sum(i.total_score for i in scored_items)
    max_score = sum(i.max_score for i in scored_items)

    by_domain: dict[str, dict] = {}
    for item in scored_items:
        if item.domain not in by_domain:
            by_domain[item.domain] = {"score": 0, "max": 0}
        by_domain[item.domain]["score"] += item.total_score
        by_domain[item.domain]["max"] += item.max_score

    domain_summaries = {
        domain: DomainSummary(
            score=data["score"],
            max=data["max"],
            percentage=round(data["score"] / data["max"] * 100, 1) if data["max"] > 0 else 0.0,
        )
        for domain, data in by_domain.items()
    }

    return RunSummary(
        total_score=total_score,
        max_score=max_score,
        percentage=round(total_score / max_score * 100, 1) if max_score > 0 else 0.0,
        by_domain=domain_summaries,
    )


async def rejudge_run(
    input_run: dict,
    eval_items_by_id: dict,
    judge_api_key: str,
    judge_model: str,
    judge_provider_name: str,
    judge_base_url: str | None = None,
) -> EvalRun:
    source_run_id = input_run["run_id"]
    original_items = input_run["items"]

    new_items: list[ItemResult] = []
    for item_data in original_items:
        item_id = item_data["item_id"]
        response = item_data["response"]
        status = item_data["status"]

        if status != "scored" or not response.strip():
            new_items.append(ItemResult(**item_data))
            continue

        eval_item = eval_items_by_id.get(item_id)
        if not eval_item:
            logger.warning("No eval item found for '%s', keeping original scores", item_id)
            new_items.append(ItemResult(**item_data))
            continue

        criteria_results = await judge_response(
            api_key=judge_api_key,
            model=judge_model,
            original_prompt=eval_item.prompt,
            response=response,
            criteria=eval_item.criteria,
            base_url=judge_base_url,
            provider=judge_provider_name,
        )

        total = sum(r.score for r in criteria_results)
        new_items.append(ItemResult(
            item_id=item_id,
            domain=item_data["domain"],
            response=response,
            criteria_results=criteria_results,
            total_score=total,
            max_score=len(eval_item.criteria),
            status="scored",
        ))

    summary = _build_summary(new_items)
    timestamp = datetime.now(timezone.utc).isoformat()

    return EvalRun(
        run_id=str(uuid.uuid4()),
        timestamp=timestamp,
        provider=input_run["provider"],
        params=input_run.get("params", {}),
        items=new_items,
        summary=summary,
        judge=JudgeSnapshot(provider=judge_provider_name, model=judge_model),
        source_run_id=source_run_id,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Re-judge existing eval results with a different judge model")
    parser.add_argument("--input", required=True, help="Glob pattern for input result files (e.g. 'results/*.json')")
    parser.add_argument("--judge-provider", default=None, help="Provider for the new judge (default: from config)")
    parser.add_argument("--judge-model", default=None, help="Model for the new judge (default: from config)")
    parser.add_argument("--evals", default="evals/", help="Path to eval items directory (default: evals/)")
    parser.add_argument("--output", default="results/", help="Results output directory (default: results/)")
    parser.add_argument("--config", default="config.yaml", help="Config file path (default: config.yaml)")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")

    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s: %(message)s",
    )

    config = load_config(args.config)
    judge_config = get_judge_config(config)
    judge_pname = args.judge_provider or judge_config.provider
    judge_model = args.judge_model or judge_config.model
    judge_pc = get_provider_config(config, judge_pname)
    judge_api_key = judge_pc.api_key or ""
    judge_base_url = judge_pc.base_url

    # Load eval items to get criterion descriptions
    eval_items = load_eval_items(args.evals)
    eval_items_by_id = {item.id: item for item in eval_items}
    logger.info("Loaded %d eval items for criterion lookup", len(eval_items))

    # Find input files
    input_files = sorted(glob.glob(args.input))
    if not input_files:
        print(f"Error: No files matched pattern '{args.input}'", file=sys.stderr)
        return 1

    logger.info("Found %d input file(s) to re-judge", len(input_files))

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    for input_file in input_files:
        logger.info("Re-judging: %s", input_file)
        with open(input_file) as f:
            input_run = json.load(f)

        eval_run = asyncio.run(rejudge_run(
            input_run=input_run,
            eval_items_by_id=eval_items_by_id,
            judge_api_key=judge_api_key,
            judge_model=judge_model,
            judge_provider_name=judge_pname,
            judge_base_url=judge_base_url,
        ))

        ts_safe = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%S")
        provider_name = input_run["provider"]["name"]
        model_safe = input_run["provider"]["model"].replace("/", "-")
        judge_model_safe = judge_model.replace("/", "-")
        filename = f"{ts_safe}_{provider_name}_{model_safe}_rejudge_{judge_model_safe}.json"
        result_path = output_dir / filename

        with open(result_path, "w") as f:
            json.dump(eval_run.model_dump(), f, indent=2)

        s = eval_run.summary
        scored = sum(1 for i in eval_run.items if i.status == "scored")
        print(f"Re-judged {scored} items from {Path(input_file).name}")
        print(f"  Judge: {judge_pname}/{judge_model}")
        print(f"  Score: {s.total_score}/{s.max_score} ({s.percentage}%)")
        print(f"  Saved: {result_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
