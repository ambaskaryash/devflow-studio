-- Migration 002: Flow versioning system
-- Stores snapshots of flow states with commit messages for rollback capability

CREATE TABLE IF NOT EXISTS flow_versions (
  id              TEXT PRIMARY KEY,
  flow_id         TEXT NOT NULL,
  version_num     INTEGER NOT NULL,
  commit_message  TEXT NOT NULL DEFAULT 'Auto-save',
  snapshot_json   TEXT NOT NULL,
  node_count      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_flow_versions_flow_id
  ON flow_versions(flow_id);

CREATE INDEX IF NOT EXISTS idx_flow_versions_version_num
  ON flow_versions(flow_id, version_num);
