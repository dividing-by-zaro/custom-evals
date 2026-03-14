from __future__ import annotations

import asyncio
import logging

import anthropic

from src.providers import Provider

logger = logging.getLogger(__name__)

MAX_RATE_LIMIT_RETRIES = 8
RATE_LIMIT_BACKOFF_BASE = 2.0
RATE_LIMIT_MAX_WAIT = 120.0


class AnthropicProvider(Provider):
    def __init__(self, api_key: str, model: str):
        self.model = model
        self.client = anthropic.AsyncAnthropic(api_key=api_key)

    async def complete(self, prompt: str, params: dict) -> str:
        for attempt in range(MAX_RATE_LIMIT_RETRIES):
            try:
                response = await self.client.messages.create(
                    model=self.model,
                    max_tokens=params.get("max_tokens", 1024),
                    temperature=params.get("temperature", 0.0),
                    messages=[{"role": "user", "content": prompt}],
                )
                if response.content and response.content[0].type == "text":
                    return response.content[0].text
                return ""
            except anthropic.RateLimitError as e:
                wait = _get_retry_wait(e, attempt)
                logger.warning(
                    "Rate limited (attempt %d/%d) for %s. Waiting %.1fs...",
                    attempt + 1, MAX_RATE_LIMIT_RETRIES, self.model, wait,
                )
                await asyncio.sleep(wait)
            except anthropic.APIStatusError as e:
                if e.status_code == 529:  # Overloaded
                    wait = _get_retry_wait(e, attempt)
                    logger.warning(
                        "API overloaded (attempt %d/%d) for %s. Waiting %.1fs...",
                        attempt + 1, MAX_RATE_LIMIT_RETRIES, self.model, wait,
                    )
                    await asyncio.sleep(wait)
                else:
                    raise

        raise RuntimeError(f"Exhausted {MAX_RATE_LIMIT_RETRIES} rate-limit retries for {self.model}")


def _get_retry_wait(error: Exception, attempt: int) -> float:
    """Extract retry-after from headers or use exponential backoff."""
    retry_after = None
    if hasattr(error, "response") and error.response is not None:
        retry_after = error.response.headers.get("retry-after")
    if retry_after:
        try:
            return min(float(retry_after), RATE_LIMIT_MAX_WAIT)
        except (ValueError, TypeError):
            pass
    return min(RATE_LIMIT_BACKOFF_BASE ** (attempt + 1), RATE_LIMIT_MAX_WAIT)
