#!/usr/bin/env python3
"""Re-judge only unparseable criteria in existing rejudge result files, patching them in-place."""

import asyncio
import json
import glob
import sys

from src.config import load_config, get_provider_config
from src.judge import _extract_json, JUDGE_SYSTEM_PROMPT, _build_judge_prompt
from src.schema import load_eval_items

from openai import AsyncOpenAI

MAX_RETRIES = 3


async def rejudge_criterion(client, model, prompt, response, criterion_desc):
    """Call the judge for a single criterion, retrying up to MAX_RETRIES times."""
    messages = [
        {"role": "system", "content": JUDGE_SYSTEM_PROMPT},
        {"role": "user", "content": (
            f"## Original Prompt\n{prompt}\n\n"
            f"## LLM Response\n{response}\n\n"
            f"## Criterion to Evaluate\n"
            f"Score 1 if the following statement is TRUE of the response. "
            f"Score 0 if it is FALSE.\n\n"
            f"{criterion_desc}"
        )},
    ]

    for attempt in range(MAX_RETRIES):
        completion = await client.chat.completions.create(
            model=model,
            messages=messages,
            max_completion_tokens=2048,
        )
        raw = completion.choices[0].message.content or ""
        parsed = _extract_json(raw)
        if parsed is not None and "score" in parsed:
            return {
                "score": 1 if parsed["score"] == 1 else 0,
                "reasoning": parsed.get("reasoning", ""),
            }
        print(f"    attempt {attempt + 1}/{MAX_RETRIES} failed, raw: {raw[:100]!r}")

    return None  # All retries failed


async def patch_file(filepath, client, model, eval_items_by_id):
    with open(filepath) as f:
        data = json.load(f)

    patched = 0
    failed = 0

    for item in data["items"]:
        if item["status"] != "scored":
            continue

        eval_item = eval_items_by_id.get(item["item_id"])
        if not eval_item:
            continue

        criteria_by_id = {c.id: c for c in eval_item.criteria}

        for cr in item["criteria_results"]:
            if "unparseable" not in cr.get("reasoning", "").lower():
                continue

            criterion = criteria_by_id.get(cr["criterion_id"])
            if not criterion:
                print(f"  WARNING: no criterion {cr['criterion_id']} for {item['item_id']}")
                failed += 1
                continue

            print(f"  re-judging {item['item_id']} / {cr['criterion_id']}...", end=" ")
            result = await rejudge_criterion(
                client, model, eval_item.prompt, item["response"], criterion.description
            )

            if result:
                cr["score"] = result["score"]
                cr["reasoning"] = result["reasoning"]
                patched += 1
                print(f"score={result['score']}")
            else:
                failed += 1
                print("STILL FAILED")

        # Recalculate item scores
        if any("unparseable" not in cr.get("reasoning", "").lower() for cr in item["criteria_results"]):
            item["total_score"] = sum(cr["score"] for cr in item["criteria_results"])

    # Recalculate summary
    scored_items = [i for i in data["items"] if i["status"] == "scored"]
    total_score = sum(i["total_score"] for i in scored_items)
    max_score = sum(i["max_score"] for i in scored_items)
    data["summary"]["total_score"] = total_score
    data["summary"]["max_score"] = max_score
    data["summary"]["percentage"] = round(total_score / max_score * 100, 1) if max_score > 0 else 0.0

    by_domain = {}
    for i in scored_items:
        d = i["domain"]
        if d not in by_domain:
            by_domain[d] = {"score": 0, "max": 0}
        by_domain[d]["score"] += i["total_score"]
        by_domain[d]["max"] += i["max_score"]
    data["summary"]["by_domain"] = {
        d: {"score": v["score"], "max": v["max"],
            "percentage": round(v["score"] / v["max"] * 100, 1) if v["max"] > 0 else 0.0}
        for d, v in by_domain.items()
    }

    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)

    return patched, failed


async def main():
    config = load_config("config.yaml")
    pc = get_provider_config(config, "openai")
    client = AsyncOpenAI(api_key=pc.api_key)
    model = "gpt-5-mini"

    eval_items = load_eval_items("evals/")
    eval_items_by_id = {item.id: item for item in eval_items}
    print(f"Loaded {len(eval_items)} eval items\n")

    files = sorted(glob.glob("results/*rejudge_gpt-5-mini*"))
    if not files:
        print("No gpt-5-mini rejudge files found")
        return

    total_patched = 0
    total_failed = 0

    for filepath in files:
        name = filepath.split("/")[-1]
        print(f"\n{name}")
        patched, failed = await patch_file(filepath, client, model, eval_items_by_id)
        total_patched += patched
        total_failed += failed
        print(f"  -> patched: {patched}, still failed: {failed}")

    print(f"\nDone. Total patched: {total_patched}, still failed: {total_failed}")


if __name__ == "__main__":
    asyncio.run(main())
