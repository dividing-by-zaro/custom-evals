from __future__ import annotations

from abc import ABC, abstractmethod

from src.models import ProviderConfig


class Provider(ABC):
    @abstractmethod
    async def complete(self, prompt: str, params: dict) -> str:
        ...


def create_provider(config: ProviderConfig) -> Provider:
    if config.provider_type == "openai":
        from src.providers.openai_provider import OpenAIProvider
        return OpenAIProvider(
            api_key=config.api_key or "",
            model=config.model,
            base_url=config.base_url,
        )
    elif config.provider_type == "anthropic":
        from src.providers.anthropic_provider import AnthropicProvider
        return AnthropicProvider(
            api_key=config.api_key or "",
            model=config.model,
        )
    elif config.provider_type == "local":
        from src.providers.local_provider import LocalProvider
        if not config.base_url:
            raise ValueError("Local provider requires a 'base_url' in config")
        return LocalProvider(
            model=config.model,
            base_url=config.base_url,
            api_key=config.api_key,
        )
    else:
        raise ValueError(f"Unknown provider type: '{config.provider_type}'")
