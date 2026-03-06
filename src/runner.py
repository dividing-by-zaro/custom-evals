from __future__ import annotations

import asyncio
import json
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from src.config import get_judge_config, get_provider_config, load_config
from src.judge import judge_response
from src.models import (
    DomainSummary,
    EvalItem,
    EvalRun,
    ItemResult,
    JudgeSnapshot,
    ProviderSnapshot,
    RunSummary,
)
from src.providers import Provider
from src.schema import load_eval_items

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 2.0


async def _call_with_retry(provider: Provider, prompt: str, params: dict) -> str:
    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            return await provider.complete(prompt, params)
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                wait = RETRY_BACKOFF_BASE ** attempt
                logger.warning(
                    "Attempt %d failed for provider call: %s. Retrying in %.1fs...",
                    attempt + 1,
                    e,
                    wait,
                )
                await asyncio.sleep(wait)
    raise last_error  # type: ignore[misc]


async def _evaluate_item(
    item: EvalItem,
    provider: Provider,
    params: dict,
    judge_api_key: str,
    judge_model: str,
    judge_base_url: str | None = None,
    judge_provider: str = "openai",
) -> ItemResult:
    try:
        response = await _call_with_retry(provider, item.prompt, params)
    except Exception as e:
        logger.error("Failed to get response for item '%s': %s", item.id, e)
        return ItemResult(
            item_id=item.id,
            domain=item.domain,
            response="",
            criteria_results=[],
            total_score=0,
            max_score=len(item.criteria),
            status="error",
            error=str(e),
        )

    if not response.strip():
        logger.warning("Empty response for item '%s', scoring all criteria as 0", item.id)
        from src.models import CriterionResult

        criteria_results = [
            CriterionResult(
                criterion_id=c.id,
                score=0,
                reasoning="Empty response from model",
            )
            for c in item.criteria
        ]
        return ItemResult(
            item_id=item.id,
            domain=item.domain,
            response=response,
            criteria_results=criteria_results,
            total_score=0,
            max_score=len(item.criteria),
            status="empty_response",
        )

    criteria_results = await judge_response(
        api_key=judge_api_key,
        model=judge_model,
        original_prompt=item.prompt,
        response=response,
        criteria=item.criteria,
        base_url=judge_base_url,
        provider=judge_provider,
    )

    total = sum(r.score for r in criteria_results)
    return ItemResult(
        item_id=item.id,
        domain=item.domain,
        response=response,
        criteria_results=criteria_results,
        total_score=total,
        max_score=len(item.criteria),
        status="scored",
    )


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


def _get_previously_scored_item_ids(output_path: str, model: str) -> set[str]:
    """Return item IDs that were already successfully scored for this model."""
    output_dir = Path(output_path)
    if not output_dir.exists():
        return set()

    scored_ids: set[str] = set()
    for result_file in output_dir.glob("*.json"):
        try:
            with open(result_file) as f:
                data = json.load(f)
            if data.get("provider", {}).get("model") != model:
                continue
            for item in data.get("items", []):
                if item.get("status") == "scored":
                    scored_ids.add(item["item_id"])
        except (json.JSONDecodeError, KeyError):
            continue
    return scored_ids


async def run_eval(
    provider_name: str,
    model_override: str | None = None,
    evals_path: str = "evals/",
    output_path: str = "results/",
    temperature: float = 0.0,
    max_tokens: int = 1024,
    judge_provider_name: str | None = None,
    judge_model_override: str | None = None,
    config_path: str = "config.yaml",
    skip_scored: bool = True,
) -> EvalRun:
    config = load_config(config_path)
    provider_config = get_provider_config(config, provider_name)
    judge_config = get_judge_config(config)

    if model_override:
        provider_config.model = model_override

    # Build the provider
    from src.providers import create_provider

    provider = create_provider(provider_config)

    # Resolve judge API key
    judge_pname = judge_provider_name or judge_config.provider
    judge_pc = get_provider_config(config, judge_pname)
    judge_api_key = judge_pc.api_key or ""
    judge_model = judge_model_override or judge_config.model
    judge_base_url = judge_pc.base_url

    # Load and validate eval items
    items = load_eval_items(evals_path)
    logger.info("Loaded %d eval items", len(items))

    # Filter out items already scored for this model
    if skip_scored:
        already_scored = _get_previously_scored_item_ids(output_path, provider_config.model)
        if already_scored:
            items = [i for i in items if i.id not in already_scored]
            logger.info("Skipped %d already-scored items, %d remaining", len(already_scored), len(items))
        if not items:
            logger.info("All items already scored for model %s, nothing to do", provider_config.model)
            return EvalRun(
                run_id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc).isoformat(),
                provider=ProviderSnapshot(
                    name=provider_config.name,
                    model=provider_config.model,
                    provider_type=provider_config.provider_type,
                ),
                params={"temperature": temperature, "max_tokens": max_tokens},
                items=[],
                summary=RunSummary(total_score=0, max_score=0, percentage=0.0, by_domain={}),
            )

    params = {"temperature": temperature, "max_tokens": max_tokens}

    # Evaluate each item
    item_results: list[ItemResult] = []
    for item in items:
        result = await _evaluate_item(
            item, provider, params, judge_api_key, judge_model, judge_base_url, judge_pname
        )
        item_results.append(result)

    summary = _build_summary(item_results)
    timestamp = datetime.now(timezone.utc).isoformat()

    eval_run = EvalRun(
        run_id=str(uuid.uuid4()),
        timestamp=timestamp,
        provider=ProviderSnapshot(
            name=provider_config.name,
            model=provider_config.model,
            provider_type=provider_config.provider_type,
        ),
        params=params,
        items=item_results,
        summary=summary,
        judge=JudgeSnapshot(provider=judge_pname, model=judge_model),
    )

    # Save results
    output_dir = Path(output_path)
    output_dir.mkdir(parents=True, exist_ok=True)
    ts_safe = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%S")
    model_safe = provider_config.model.replace("/", "-")
    filename = f"{ts_safe}_{provider_config.name}_{model_safe}.json"
    result_path = output_dir / filename

    with open(result_path, "w") as f:
        json.dump(eval_run.model_dump(), f, indent=2)

    return eval_run


def print_summary(eval_run: EvalRun, result_path: str | None = None) -> None:
    s = eval_run.summary
    scored = sum(1 for i in eval_run.items if i.status == "scored")
    failed = sum(1 for i in eval_run.items if i.status in ("error", "empty_response"))
    total = len(eval_run.items)

    print(f"Eval run complete: {scored}/{total} items scored", end="")
    if failed:
        print(f" ({failed} failed/empty, excluded from score)")
    else:
        print()
    print(f"Provider: {eval_run.provider.name} / {eval_run.provider.model}")
    print(f"Overall: {s.total_score}/{s.max_score} ({s.percentage}%)")

    for domain, ds in s.by_domain.items():
        print(f"  {domain}: {ds.score}/{ds.max} ({ds.percentage}%)")

    if result_path:
        print(f"Results saved to: {result_path}")
