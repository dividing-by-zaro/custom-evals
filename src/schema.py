from __future__ import annotations

import json
from pathlib import Path

from pydantic import ValidationError

from src.models import EvalItem


def load_eval_items(evals_path: str = "evals/") -> list[EvalItem]:
    path = Path(evals_path)

    if path.is_file():
        return _load_from_file(path)

    if not path.is_dir():
        raise FileNotFoundError(f"Evals path not found: {evals_path}")

    json_files = sorted(path.glob("*.json"))
    if not json_files:
        raise FileNotFoundError(f"No JSON files found in {evals_path}")

    items: list[EvalItem] = []
    for json_file in json_files:
        items.extend(_load_from_file(json_file))

    _validate_unique_ids(items)
    return items


def _load_from_file(path: Path) -> list[EvalItem]:
    try:
        with open(path) as f:
            raw = json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in {path}: {e}") from e

    if not isinstance(raw, list):
        raise ValueError(f"Expected a JSON array in {path}, got {type(raw).__name__}")

    items: list[EvalItem] = []
    for i, entry in enumerate(raw):
        try:
            items.append(EvalItem.model_validate(entry))
        except ValidationError as e:
            raise ValueError(f"Invalid eval item at index {i} in {path}: {e}") from e

    return items


def _validate_unique_ids(items: list[EvalItem]) -> None:
    seen: set[str] = set()
    for item in items:
        if item.id in seen:
            raise ValueError(f"Duplicate eval item ID: '{item.id}'")
        seen.add(item.id)
