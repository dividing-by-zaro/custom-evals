from __future__ import annotations

import asyncio
import logging

from openai import AsyncOpenAI, RateLimitError, APIStatusError

from src.providers import Provider

logger = logging.getLogger(__name__)

MAX_RATE_LIMIT_RETRIES = 8
RATE_LIMIT_BACKOFF_BASE = 2.0
RATE_LIMIT_MAX_WAIT = 120.0


class OpenAIProvider(Provider):
    def __init__(self, api_key: str, model: str, base_url: str | None = None):
        self.model = model
        kwargs: dict = {"api_key": api_key}
        if base_url:
            kwargs["base_url"] = base_url
        self.client = AsyncOpenAI(**kwargs)

    async def complete(self, prompt: str, params: dict) -> str:
        max_tokens = params.get("max_tokens", 1024)
        kwargs: dict = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": params.get("temperature", 0.0),
        }
        use_max_completion_tokens = False

        for attempt in range(MAX_RATE_LIMIT_RETRIES):
            try:
                call_kwargs = dict(kwargs)
                if use_max_completion_tokens:
                    # Reasoning models (gpt-5, o-series) use max_completion_tokens
                    # which includes internal reasoning tokens — need a much higher
                    # budget so the model has room for both thinking and output.
                    call_kwargs["max_completion_tokens"] = max(max_tokens * 8, 8192)
                else:
                    call_kwargs["max_tokens"] = max_tokens
                response = await self.client.chat.completions.create(**call_kwargs)
                return response.choices[0].message.content or ""
            except RateLimitError as e:
                wait = _get_retry_wait(e, attempt)
                logger.warning(
                    "Rate limited (attempt %d/%d) for %s. Waiting %.1fs...",
                    attempt + 1, MAX_RATE_LIMIT_RETRIES, self.model, wait,
                )
                await asyncio.sleep(wait)
            except APIStatusError as e:
                if e.status_code == 529:  # Overloaded
                    wait = _get_retry_wait(e, attempt)
                    logger.warning(
                        "API overloaded (attempt %d/%d) for %s. Waiting %.1fs...",
                        attempt + 1, MAX_RATE_LIMIT_RETRIES, self.model, wait,
                    )
                    await asyncio.sleep(wait)
                elif "max_completion_tokens" in str(e) and not use_max_completion_tokens:
                    use_max_completion_tokens = True
                    continue
                else:
                    raise
            except Exception as e:
                if "max_completion_tokens" in str(e) and not use_max_completion_tokens:
                    use_max_completion_tokens = True
                    continue
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
