from __future__ import annotations

import anthropic

from src.providers import Provider


class AnthropicProvider(Provider):
    def __init__(self, api_key: str, model: str):
        self.model = model
        self.client = anthropic.AsyncAnthropic(api_key=api_key)

    async def complete(self, prompt: str, params: dict) -> str:
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=params.get("max_tokens", 1024),
            temperature=params.get("temperature", 0.0),
            messages=[{"role": "user", "content": prompt}],
        )
        if response.content and response.content[0].type == "text":
            return response.content[0].text
        return ""
