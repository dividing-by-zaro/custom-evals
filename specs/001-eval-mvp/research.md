# Research: Custom LLM Evaluation MVP

**Date**: 2026-03-05
**Branch**: `001-eval-mvp`

## R1: Scoring Mechanism

**Decision**: LLM-as-judge with structured binary output

**Rationale**: LLM-as-judge is paradoxically simpler to implement than
pattern matching for an MVP. Rubric criteria are written in natural
language (no regex/DSL needed), and binary scoring is the most reliable
scale for LLM judges (80-90% agreement with human evaluators). The judge
returns structured JSON `{"score": 0|1, "reasoning": "..."}` with
temperature=0 for reproducibility.

**Alternatives considered**:
- **String/pattern matching**: Simpler for trivial criteria (contains
  keyword, regex match) but requires a mini-DSL, is brittle to
  rephrasing, and cannot evaluate reasoning quality. Poor for real-world
  eval items.
- **Hybrid (pattern + judge)**: Most flexible but adds schema complexity
  (multiple check types) and cognitive overhead for eval authors. Better
  as a future optimization.

**Implementation notes**:
- Judge model: configurable, default to a capable model (Claude Sonnet
  or GPT-4o) -- must be different from the model being evaluated
- Judge calls run concurrently via asyncio for performance
- Judge reasoning stored in results for debuggability
- Cost estimate: ~$0.02/criterion with mid-tier model, ~$0.60 for 30
  criteria per run -- negligible at MVP scale

## R2: Dashboard Technology

**Decision**: Streamlit

**Rationale**: Fewest lines of code (~40 lines for this use case),
looks polished out of the box with no CSS/HTML work, built-in dataframe
and chart components handle leaderboard and per-domain breakdowns
natively. Empty state handling is trivial (`st.info()`).

**Alternatives considered**:
- **Flask + static HTML**: ~3x more code, requires CSS framework and
  templates directory. Better control but more effort for MVP.
- **FastAPI + Jinja2**: Async complexity with no benefit for a read-only
  dashboard.
- **Plain HTML + http.server**: Zero dependencies but requires raw
  HTML/CSS/JS authoring. Too much effort to look decent.

**Trade-off**: Streamlit is the heaviest dependency (~30+ transitive
packages, ~200MB). Acceptable for a local dev tool.

## R3: Local LLM Connectivity via SSH

**Decision**: Pre-configured tunnel (user manages SSH themselves)

**Rationale**: Zero tunneling code to write, test, or debug. The eval
runner is just an OpenAI SDK client with a configurable `base_url`
(e.g., `http://localhost:8000/v1`). The user sets up SSH port forwarding
with a one-liner: `ssh -L 8000:localhost:8000 user@remote-server`.

**Alternatives considered**:
- **subprocess ssh -L**: Fragile -- detecting tunnel readiness requires
  polling/sleep. Error-prone signal handling for cleanup.
- **Paramiko**: ~100 lines of boilerplate for port forwarding. Heavy
  dependency (cryptography/libffi).
- **sshtunnel library**: Clean context-manager API, good upgrade path
  if we later want programmatic tunneling. Not needed for MVP.

**Implementation notes**:
- Local provider config is just a `base_url` field
- OpenAI SDK natively supports custom base URLs
- Documentation will include SSH tunnel setup instructions
- Upgrade path: wrap entry point with `sshtunnel` context manager later

## R4: Provider Architecture

**Decision**: All three providers use the OpenAI SDK with different
base URLs and API keys

**Rationale**:
- **OpenAI**: Native SDK usage with default base URL
- **Anthropic**: Use the Anthropic Python SDK directly (different
  message format requires a thin adapter)
- **Local LLM**: OpenAI SDK with custom `base_url` pointing to the
  forwarded local endpoint

The runner defines a `Provider` protocol/ABC with a single
`complete(prompt: str, params: dict) -> str` method. Each provider
implements this interface. Eval items and scoring logic are completely
decoupled from provider details.

## R5: Result Storage Format

**Decision**: One JSON file per eval run, stored in `results/` directory

**Rationale**: Simple, human-readable, directly consumable by Streamlit.
File naming convention: `{timestamp}_{provider}_{model}.json`.

No database needed at MVP scale. Streamlit reads all JSON files from
the directory on each page load.
