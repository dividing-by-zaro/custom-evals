from __future__ import annotations

import asyncio
import json

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


async def _judge_single_criterion(
    client: AsyncOpenAI,
    model: str,
    original_prompt: str,
    response: str,
    criterion: RubricCriterion,
) -> CriterionResult:
    judge_prompt = _build_judge_prompt(original_prompt, response, criterion)

    completion = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": JUDGE_SYSTEM_PROMPT},
            {"role": "user", "content": judge_prompt},
        ],
        temperature=0.0,
        max_tokens=256,
    )

    raw = completion.choices[0].message.content or ""
    try:
        parsed = json.loads(raw)
        score = 1 if parsed.get("score") == 1 else 0
        reasoning = parsed.get("reasoning", "")
    except (json.JSONDecodeError, AttributeError):
        score = 0
        reasoning = f"Judge returned unparseable response: {raw[:200]}"

    return CriterionResult(
        criterion_id=criterion.id,
        score=score,
        reasoning=reasoning,
    )


async def judge_response(
    api_key: str,
    model: str,
    original_prompt: str,
    response: str,
    criteria: list[RubricCriterion],
    base_url: str | None = None,
) -> list[CriterionResult]:
    kwargs: dict = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
    client = AsyncOpenAI(**kwargs)

    tasks = [
        _judge_single_criterion(client, model, original_prompt, response, c)
        for c in criteria
    ]
    return await asyncio.gather(*tasks)
