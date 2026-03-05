#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import logging
import sys

from src.runner import print_summary, run_eval


def main() -> int:
    parser = argparse.ArgumentParser(description="Run LLM evaluation set")
    parser.add_argument("--provider", required=True, help="Provider name from config")
    parser.add_argument("--model", default=None, help="Override model identifier")
    parser.add_argument("--evals", default="evals/", help="Path to eval items (default: evals/)")
    parser.add_argument("--output", default="results/", help="Results output directory (default: results/)")
    parser.add_argument("--temperature", type=float, default=0.0, help="Generation temperature (default: 0.0)")
    parser.add_argument("--max-tokens", type=int, default=1024, help="Max tokens (default: 1024)")
    parser.add_argument("--judge-provider", default=None, help="Provider for LLM judge (default: from config)")
    parser.add_argument("--judge-model", default=None, help="Model for LLM judge (default: from config)")
    parser.add_argument("--config", default="config.yaml", help="Config file path (default: config.yaml)")
    parser.add_argument("--no-skip-scored", action="store_true", help="Re-evaluate items even if already scored for this model")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")

    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s: %(message)s",
    )

    try:
        eval_run = asyncio.run(
            run_eval(
                provider_name=args.provider,
                model_override=args.model,
                evals_path=args.evals,
                output_path=args.output,
                temperature=args.temperature,
                max_tokens=args.max_tokens,
                judge_provider_name=args.judge_provider,
                judge_model_override=args.judge_model,
                config_path=args.config,
                skip_scored=not args.no_skip_scored,
            )
        )
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    except ValueError as e:
        print(f"Validation error: {e}", file=sys.stderr)
        return 1
    except ConnectionError as e:
        print(f"Connection error: {e}", file=sys.stderr)
        return 2

    has_errors = any(i.status == "error" for i in eval_run.items)
    print_summary(eval_run)

    return 3 if has_errors else 0


if __name__ == "__main__":
    sys.exit(main())
