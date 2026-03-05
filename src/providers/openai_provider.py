from __future__ import annotations

from openai import AsyncOpenAI

from src.providers import Provider


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
        # Newer OpenAI models require max_completion_tokens
        try:
            kwargs["max_tokens"] = max_tokens
            response = await self.client.chat.completions.create(**kwargs)
        except Exception as e:
            if "max_completion_tokens" in str(e):
                del kwargs["max_tokens"]
                kwargs["max_completion_tokens"] = max_tokens
                response = await self.client.chat.completions.create(**kwargs)
            else:
                raise
        return response.choices[0].message.content or ""
