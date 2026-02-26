-- Migration 003: Structured audit logging
-- Per-execution, per-node structured log entries with retention support

ALTER TABLE executions ADD COLUMN log_file_path TEXT;

CREATE TABLE IF NOT EXISTS execution_logs (
  id           TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  node_id      TEXT NOT NULL,
  node_label   TEXT NOT NULL DEFAULT '',
  level        TEXT NOT NULL DEFAULT 'info',  -- info | stdout | stderr | error | warn
  message      TEXT NOT NULL,
  timestamp    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exec_logs_execution_id
  ON execution_logs(execution_id);

CREATE INDEX IF NOT EXISTS idx_exec_logs_node_id
  ON execution_logs(execution_id, node_id);

CREATE INDEX IF NOT EXISTS idx_exec_logs_level
  ON execution_logs(execution_id, level);
