<!--
  Sync Impact Report
  ===================================
  Version change: N/A (initial) -> 1.0.0
  Modified principles: N/A (first ratification)
  Added sections:
    - Core Principles (5 principles)
    - Evaluation Data Standards
    - Development Workflow
    - Governance
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md: N/A (generic, no constitution-specific refs)
    - .specify/templates/spec-template.md: N/A (generic, no constitution-specific refs)
    - .specify/templates/tasks-template.md: N/A (generic, no constitution-specific refs)
  Follow-up TODOs: None
-->

# Custom Evals Constitution

## Core Principles

### I. Objective Binary Scoring

All evaluation rubric items MUST use binary scoring (0 or 1 points).
Rubric criteria MUST be unambiguous and mechanically verifiable
wherever possible. No partial credit, no subjective scales. Each
rubric item MUST include a clear condition that determines whether
the point is awarded. This ensures reproducibility across evaluators
(human or automated).

### II. Domain-Tagged Items

Every evaluation item MUST be tagged with exactly one domain. Domains
categorize the type of knowledge or capability being tested (e.g.,
reasoning, coding, math, factual recall). Domain tags MUST be
consistent strings used across all items. New domains require
documentation in the eval item set before use. This enables per-domain
performance analysis on the dashboard and leaderboard.

### III. Provider-Agnostic Runner

The evaluation runner MUST support multiple LLM providers through a
unified interface: OpenAI API, Anthropic API, and custom local LLMs
accessible via SSH. Adding a new provider MUST NOT require changes to
evaluation items or scoring logic. Provider configuration (endpoints,
auth, SSH details) MUST be externalized from code into configuration
files or environment variables. Credentials MUST NOT be committed to
version control.

### IV. Reproducible Results

Every evaluation run MUST record: the model identifier, provider,
timestamp, prompt parameters (temperature, max tokens, etc.), and the
full set of scores. Results MUST be stored in a structured format
(JSON) that the dashboard can consume directly. Re-running the same
eval set against the same model with the same parameters MUST produce
a comparable result set (accounting for model non-determinism by
recording all parameters).

### V. Separation of Concerns

The project MUST maintain clear boundaries between three components:
(1) evaluation data (items + rubrics), (2) the runner (prompt
dispatch + scoring), and (3) the presentation layer (dashboard +
leaderboard). Each component MUST be independently modifiable. Eval
items are plain data (JSON/YAML). The runner is a Python script. The
dashboard reads stored results without coupling to the runner.

## Evaluation Data Standards

- Eval items MUST be stored as structured data (JSON), not embedded
  in code.
- Each item MUST contain: a unique ID, domain tag, prompt text, and
  a list of rubric criteria.
- Each rubric criterion MUST contain: a description and a scoring
  condition that resolves to 0 or 1.
- The item schema MUST be validated before any eval run begins.

## Development Workflow

- Python is the primary language; use `uv` for all package management.
- All scripts MUST be runnable via `uv run`.
- Configuration for providers MUST support environment variables
  and/or a local config file (e.g., `config.yaml` or `.env`).
- The dashboard MUST be a lightweight web interface that reads
  results from the stored JSON files.

## Governance

This constitution defines the non-negotiable standards for the
custom-evals project. All code changes MUST comply with these
principles. Amendments require updating this document, incrementing
the version, and verifying that existing eval items and results remain
compatible with any structural changes. Use `CLAUDE.md` for runtime
development guidance.

**Version**: 1.0.0 | **Ratified**: 2026-03-05 | **Last Amended**: 2026-03-05
