# Quality Gate Release / Rollback Checklist & On-Call Procedures

> 质量门发布/回滚清单与 On-Call 操作步骤

## Pre-Release Checklist

### 1. Code Readiness

- [ ] All quality gate tests pass: `cargo test --workspace`
- [ ] Frontend tests pass: `cd frontend && pnpm test:run`
- [ ] Type check clean: `pnpm run frontend:check`
- [ ] Lint clean: `pnpm run frontend:lint && pnpm run backend:lint`
- [ ] Types up-to-date: `pnpm run generate-types:check`
- [ ] Database migrations applied: `pnpm run prepare-db:check`

### 2. Configuration Verification

- [ ] `quality/quality-gate.yaml` reviewed and committed
- [ ] `QUALITY_GATE_MODE` set to target mode (`shadow` / `warn` / `enforce`)
- [ ] SonarCloud/SonarQube token configured (if Sonar provider enabled)
- [ ] `sonar-project.properties` paths match current project structure

### 3. CI Pipeline

- [ ] All 3 GitHub Actions workflows green: Basic Checks, Quality Gate, Docker Build
- [ ] Branch protection rules updated for target environment
- [ ] Required checks list matches current workflow job names

---

## Rollout Stages

### Stage 1: Shadow Mode (Week 1)

```bash
# Set mode
export QUALITY_GATE_MODE=shadow

# Or in quality-gate.yaml:
# mode: shadow
```

**Config**: `quality/quality-gate.yaml` ships with `mode: shadow` by default.

**Baseline collection**: After 1 week of shadow data, generate a quality baseline:
```bash
scripts/quality/collect-report.sh
cp quality-report.json quality/baselines/baseline-YYYY-MM-DD.json
```
See `quality/baselines/README.md` for details on the baseline strategy.

**Behavior**: Quality engine runs on every checkpoint commit, results logged and stored in database, but never blocks terminal progression.

**Monitoring**:
- Check `quality_run` table for run counts and pass/fail ratios
- Review WebSocket `quality.gate_result` events in browser devtools
- Verify QualityBadge renders correctly in Pipeline/Board views

**Success criteria**: 1 week of stable shadow runs, no crashes, no false positives blocking unrelated workflows.

### Stage 2: Warn Mode (Week 2)

```bash
export QUALITY_GATE_MODE=warn
```

**Config overlay**: `quality/profiles/warn-mode.yaml` — copy to `quality-gate.yaml` or set the environment variable above. This profile enables terminal feedback and UI badges but does not block progression.

**Behavior**: Quality results shown to user, warnings displayed in UI, but terminal progression is NOT blocked.

**Monitoring**:
- Verify warning badges appear on terminals with quality issues
- Confirm QualityReportPanel shows actionable issue details
- Check that terminals still complete normally despite warnings

**Success criteria**: Users see quality feedback, no workflow disruption, issue counts trending down.

### Stage 3: Enforce Mode (Week 3+)

```bash
export QUALITY_GATE_MODE=enforce
```

**Config overlay**: `quality/profiles/enforce-mode.yaml` — copy to `quality-gate.yaml` or set the environment variable above. This profile blocks progression on any quality gate failure and requires all CI checks (`basic-checks`, `quality-gate`, `frontend-check`) to pass.

**Behavior**: Quality gate failures block terminal progression. Original terminal receives structured fix instructions. Terminal must re-checkpoint and pass before handoff.

**Monitoring**:
- Verify blocked terminals receive quality feedback via PTY stdin
- Confirm re-checkpoint → re-analysis → pass flow works end-to-end
- Monitor average fix loop iterations (target: ≤ 2 per terminal)

**Success criteria**: Quality gate catches real issues, fix loop completes within reasonable time, no infinite loops.

---

## Rollback Procedures

### Immediate Rollback (< 1 minute)

For any quality gate issue blocking workflows:

```bash
# Option 1: Disable quality gate entirely
export QUALITY_GATE_MODE=off

# Option 2: Downgrade to shadow mode
export QUALITY_GATE_MODE=shadow
```

Restart the server after changing the environment variable. All in-flight workflows will use the new mode for subsequent checkpoints.

### Database Rollback

If quality gate data is corrupted or causing issues:

```sql
-- Mark all pending quality runs as skipped
UPDATE quality_run
SET status = 'skipped', completed_at = datetime('now'), updated_at = datetime('now')
WHERE status IN ('pending', 'running');

-- Unblock any terminals stuck in quality_pending
-- (Orchestrator will re-evaluate on next event)
```

### Migration Rollback

If a database migration causes issues:

```bash
# Revert the last migration
sqlx migrate revert --database-url crates/db/data.db --source crates/db/migrations

# Rebuild and restart
cargo build --release -p server
```

### Full Feature Rollback

To completely remove quality gate from a deployment:

1. Set `QUALITY_GATE_MODE=off`
2. Restart server
3. Existing workflows continue with legacy flow (checkpoint = completed)
4. No data loss — quality tables remain but are unused

---

## On-Call Procedures

### Scenario 1: Quality Engine Crash

**Symptoms**: Terminal stuck in `quality_pending`, no quality events in WebSocket.

**Steps**:
1. Check server logs: `RUST_LOG=debug` for quality module output
2. Verify quality engine dependencies are available (`cargo`, `pnpm`, `node`)
3. If engine is down, set `QUALITY_GATE_MODE=shadow` to unblock workflows
4. Recover stuck terminals:
   ```sql
   UPDATE quality_run SET status = 'failed', error = 'Manual recovery'
   WHERE status IN ('pending', 'running') AND updated_at < datetime('now', '-10 minutes');
   ```

### Scenario 2: SonarCloud/SonarQube Unavailable

**Symptoms**: Sonar provider returns timeout or connection errors.

**Steps**:
1. Check Sonar service status (SonarCloud status page or self-hosted health endpoint)
2. Quality gate degrades automatically:
   - `shadow`/`warn` mode: Logs error, continues without Sonar results
   - `enforce` mode: Falls back to local analyzers only (clippy, eslint, tsc)
3. If persistent, disable Sonar provider in `quality-gate.yaml`:
   ```yaml
   providers:
     sonar:
       enabled: false
   ```

### Scenario 3: False Positive Blocking

**Symptoms**: Quality gate fails on code that is correct, blocking terminal progression.

**Steps**:
1. Identify the false positive issue in QualityReportPanel or `quality_issue` table
2. Immediate fix — downgrade to `warn` mode: `QUALITY_GATE_MODE=warn`
3. Long-term fix — add exclusion to `quality-gate.yaml`:
   ```yaml
   exclusions:
     paths:
       - "generated/**"
       - "vendor/**"
     rules:
       - id: "clippy::false_positive_lint"
         reason: "Known false positive in nightly toolchain"
   ```
4. Re-run quality gate after config update

### Scenario 4: Infinite Fix Loop

**Symptoms**: Terminal keeps failing quality gate, re-submitting, failing again.

**Steps**:
1. Check `quality_run` table for the terminal — count consecutive failures
2. If > 3 consecutive failures on same issues, likely an unfixable lint or config problem
3. Options:
   - Add temporary exclusion for the blocking rule
   - Switch to `warn` mode for this workflow
   - Manually mark terminal as completed:
     ```sql
     UPDATE terminals SET status = 'completed' WHERE id = '<terminal_id>';
     ```

### Scenario 5: Database Lock / Performance

**Symptoms**: Slow quality queries, database locked errors.

**Steps**:
1. Check for long-running quality scans: `SELECT * FROM quality_run WHERE status = 'running'`
2. Kill stuck runs older than 10 minutes (see Scenario 1 recovery SQL)
3. If `quality_issue` table is very large, run cleanup:
   ```sql
   -- Delete issues from runs older than 30 days
   DELETE FROM quality_issue
   WHERE run_id IN (SELECT id FROM quality_run WHERE created_at < datetime('now', '-30 days'));

   DELETE FROM quality_run WHERE created_at < datetime('now', '-30 days');
   ```

---

## Monitoring Checklist (Daily)

- [ ] Quality gate pass rate > 80% (check `quality_run` table)
- [ ] No terminals stuck in `quality_pending` for > 10 minutes
- [ ] WebSocket `quality.gate_result` events flowing (check browser devtools)
- [ ] SonarCloud dashboard accessible and showing recent analyses
- [ ] No error-level logs from quality engine in server output

## Emergency Contacts

| Role | Responsibility |
|------|---------------|
| Backend on-call | Quality engine crashes, database issues, orchestrator bugs |
| Frontend on-call | UI rendering issues, WebSocket event handling, badge display |
| DevOps on-call | CI pipeline failures, SonarCloud connectivity, Docker issues |
