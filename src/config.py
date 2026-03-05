from __future__ import annotations

import os
from pathlib import Path

import yaml

from src.models import JudgeConfig, ProviderConfig


def _load_dotenv() -> None:
    """Load .env file from current or parent directories."""
    current = Path.cwd()
    for directory in [current, *current.parents]:
        env_file = directory / ".env"
        if env_file.is_file():
            with open(env_file) as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, _, value = line.partition("=")
                    key = key.strip()
                    value = value.strip().strip("\"'")
                    if key and key not in os.environ:
                        os.environ[key] = value
            break


def load_config(config_path: str = "config.yaml") -> dict:
    path = Path(config_path)
    if not path.exists():
        raise FileNotFoundError(
            f"Config file not found: {config_path}. "
            "Copy config.example.yaml to config.yaml and fill in your settings."
        )
    _load_dotenv()
    with open(path) as f:
        return yaml.safe_load(f)


def get_provider_config(config: dict, provider_name: str) -> ProviderConfig:
    providers = config.get("providers", {})
    if provider_name not in providers:
        available = ", ".join(providers.keys()) or "(none)"
        raise ValueError(
            f"Unknown provider '{provider_name}'. Available: {available}"
        )

    raw = providers[provider_name]
    api_key = None
    api_key_env = raw.get("api_key_env")
    if api_key_env:
        api_key = os.environ.get(api_key_env)
        if not api_key and raw.get("provider_type") != "local":
            raise ValueError(
                f"Environment variable '{api_key_env}' not set for provider '{provider_name}'"
            )

    return ProviderConfig(
        name=provider_name,
        provider_type=raw["provider_type"],
        model=raw["model"],
        base_url=raw.get("base_url"),
        api_key=api_key,
        api_key_env=api_key_env,
        default_params=raw.get("default_params"),
    )


def get_judge_config(config: dict) -> JudgeConfig:
    raw = config.get("judge", {})
    return JudgeConfig(**raw)
