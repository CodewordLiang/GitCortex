-- Quality Policy Snapshot table
-- Phase 29-B03: Stores snapshots of quality gate configuration
-- at the time of each quality run for audit and reproducibility.

CREATE TABLE IF NOT EXISTS quality_policy_snapshot (
    id              TEXT PRIMARY KEY NOT NULL,
    quality_run_id  TEXT NOT NULL REFERENCES quality_run(id) ON DELETE CASCADE,
    config_yaml     TEXT NOT NULL,
    mode            TEXT NOT NULL DEFAULT 'shadow',
    tier            TEXT NOT NULL DEFAULT 'terminal',
    providers_json  TEXT,
    thresholds_json TEXT,
    created_at      DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_quality_policy_snapshot_run ON quality_policy_snapshot(quality_run_id);
