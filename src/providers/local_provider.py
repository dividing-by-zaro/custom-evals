from __future__ import annotations

from openai import AsyncOpenAI

from src.providers import Provider


class LocalProvider(Provider):
    def __init__(self, model: str, base_url: str, api_key: str | None = None):
        self.model = model
        self.client = AsyncOpenAI(
            api_key=api_key or "not-needed",
            base_url=base_url,
        )

    async def complete(self, prompt: str, params: dict) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=params.get("temperature", 0.0),
            max_tokens=params.get("max_tokens", 1024),
        )
        return response.choices[0].message.content or ""
