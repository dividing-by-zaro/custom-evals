from __future__ import annotations

from pydantic import BaseModel, Field


class RubricCriterion(BaseModel):
    id: str
    description: str


class EvalItem(BaseModel):
    id: str
    domain: str
    prompt: str
    criteria: list[RubricCriterion] = Field(min_length=1)
    metadata: dict | None = None


class ProviderConfig(BaseModel):
    name: str
    provider_type: str  # "openai" | "anthropic" | "local"
    model: str
    base_url: str | None = None
    api_key: str | None = None
    api_key_env: str | None = None
    default_params: dict | None = None


class JudgeConfig(BaseModel):
    provider: str = "openai"
    model: str = "gpt-4o"
    temperature: float = 0.0


class CriterionResult(BaseModel):
    criterion_id: str
    score: int  # 0 or 1
    reasoning: str


class ItemResult(BaseModel):
    item_id: str
    domain: str
    response: str
    criteria_results: list[CriterionResult]
    total_score: int
    max_score: int
    status: str  # "scored" | "error" | "empty_response"
    error: str | None = None


class DomainSummary(BaseModel):
    score: int
    max: int
    percentage: float


class RunSummary(BaseModel):
    total_score: int
    max_score: int
    percentage: float
    by_domain: dict[str, DomainSummary]


class ProviderSnapshot(BaseModel):
    name: str
    model: str
    provider_type: str


class JudgeSnapshot(BaseModel):
    provider: str
    model: str


class EvalRun(BaseModel):
    run_id: str
    timestamp: str
    provider: ProviderSnapshot
    params: dict
    items: list[ItemResult]
    summary: RunSummary
    judge: JudgeSnapshot | None = None
    source_run_id: str | None = None
