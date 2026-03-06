from __future__ import annotations

import asyncio
import json

from anthropic import AsyncAnthropic
from openai import AsyncOpenAI

from src.models import CriterionResult, RubricCriterion


JUDGE_SYSTEM_PROMPT = """You are an objective evaluation judge. You will be given:
1. An original prompt that was sent to an LLM
2. The LLM's response
3. A scoring criterion to evaluate

You must determine if the response meets the criterion. Score 1 if the criterion is met, 0 if not.

Respond with ONLY valid JSON in this exact format:
{"score": 0, "reasoning": "Brief explanation"}
or
{"score": 1, "reasoning": "Brief explanation"}"""


def _build_judge_prompt(
    original_prompt: str, response: str, criterion: RubricCriterion
) -> str:
    return (
        f"## Original Prompt\n{original_prompt}\n\n"
        f"## LLM Response\n{response}\n\n"
        f"## Criterion to Evaluate\n"
        f"Score 1 if the following statement is TRUE of the response. "
        f"Score 0 if it is FALSE.\n\n"
        f"{criterion.description}"
    )


def _extract_json(raw: str) -> dict | None:
    """Try to parse JSON from raw text, including extracting from markdown fences."""
    raw = raw.strip()
    if not raw:
        return None
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        pass
    # Try extracting from ```json ... ``` or ``` ... ```
    import re
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except (json.JSONDecodeError, ValueError):
            pass
    # Try finding first { ... } in the text
    m = re.search(r"\{.*\}", raw, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except (json.JSONDecodeError, ValueError):
            pass
    return None


MAX_JUDGE_RETRIES = 2


async def _judge_single_criterion_openai(
    client: AsyncOpenAI,
    model: str,
    original_prompt: str,
    response: str,
    criterion: RubricCriterion,
) -> CriterionResult:
    judge_prompt = _build_judge_prompt(original_prompt, response, criterion)

    last_raw = ""
    for _attempt in range(MAX_JUDGE_RETRIES):
        completion = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": JUDGE_SYSTEM_PROMPT},
                {"role": "user", "content": judge_prompt},
            ],
            max_completion_tokens=2048,
        )

        last_raw = completion.choices[0].message.content or ""
        parsed = _extract_json(last_raw)
        if parsed is not None and "score" in parsed:
            return CriterionResult(
                criterion_id=criterion.id,
                score=1 if parsed.get("score") == 1 else 0,
                reasoning=parsed.get("reasoning", ""),
            )

    return CriterionResult(
        criterion_id=criterion.id,
        score=0,
        reasoning=f"Judge returned unparseable response: {last_raw[:200]}",
    )


async def _judge_single_criterion_anthropic(
    client: AsyncAnthropic,
    model: str,
    original_prompt: str,
    response: str,
    criterion: RubricCriterion,
) -> CriterionResult:
    judge_prompt = _build_judge_prompt(original_prompt, response, criterion)

    last_raw = ""
    for _attempt in range(MAX_JUDGE_RETRIES):
        message = await client.messages.create(
            model=model,
            max_tokens=2048,
            system=JUDGE_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": judge_prompt}],
        )

        last_raw = message.content[0].text if message.content else ""
        parsed = _extract_json(last_raw)
        if parsed is not None and "score" in parsed:
            return CriterionResult(
                criterion_id=criterion.id,
                score=1 if parsed.get("score") == 1 else 0,
                reasoning=parsed.get("reasoning", ""),
            )

    return CriterionResult(
        criterion_id=criterion.id,
        score=0,
        reasoning=f"Judge returned unparseable response: {last_raw[:200]}",
    )


async def judge_response(
    api_key: str,
    model: str,
    original_prompt: str,
    response: str,
    criteria: list[RubricCriterion],
    base_url: str | None = None,
    provider: str = "openai",
) -> list[CriterionResult]:
    if provider == "anthropic":
        client = AsyncAnthropic(api_key=api_key)
        tasks = [
            _judge_single_criterion_anthropic(client, model, original_prompt, response, c)
            for c in criteria
        ]
    else:
        kwargs: dict = {"api_key": api_key}
        if base_url:
            kwargs["base_url"] = base_url
        client = AsyncOpenAI(**kwargs)
        tasks = [
            _judge_single_criterion_openai(client, model, original_prompt, response, c)
            for c in criteria
        ]
    return await asyncio.gather(*tasks)
