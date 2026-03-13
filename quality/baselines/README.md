# Quality Baselines

This directory stores quality baselines used by the quality engine's "only block new issues" strategy.

Each baseline captures a snapshot of the project's quality metrics at a point in time. The quality engine compares current analysis results against the latest baseline to determine whether new issues have been introduced — rather than requiring all historical issues to be fixed before passing.

## Generating a Baseline

After running in **shadow mode** for at least 1 week (to ensure stable, representative data), generate a baseline:

```bash
scripts/quality/collect-report.sh
```

This produces a JSON report of current quality metrics.

## Saving a Baseline

Save the generated report into this directory with a date-stamped filename:

```bash
cp quality-report.json quality/baselines/baseline-YYYY-MM-DD.json
```

For example:

```bash
cp quality-report.json quality/baselines/baseline-2026-03-20.json
```

## How Baselines Are Used

- The quality engine automatically picks the **latest** `baseline-*.json` file in this directory (sorted by filename date).
- During `warn` and `enforce` modes, new analysis results are compared against this baseline.
- Only **newly introduced** issues (above the baseline counts) trigger warnings or blocks.
- To update the baseline (e.g., after a major cleanup), simply generate and save a new one. The previous baselines are kept for historical reference.
