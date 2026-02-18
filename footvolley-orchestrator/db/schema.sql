-- Footvolley Orchestrator Schema
-- 9 tables for the AI orchestration system

CREATE DATABASE IF NOT EXISTS footvolley_ops
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE footvolley_ops;

-- 1. Tasks: main work queue
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  epic VARCHAR(100),
  category ENUM('frontend', 'backend', 'infrastructure', 'research', 'testing') NOT NULL DEFAULT 'backend',
  status ENUM('DISCOVERED', 'SPECCED', 'READY', 'IN_PROGRESS', 'TESTING', 'REVIEW', 'DONE', 'BLOCKED', 'FAILED') NOT NULL DEFAULT 'DISCOVERED',
  priority INT NOT NULL DEFAULT 5,
  risk_tier ENUM('critical', 'high', 'medium', 'low') NOT NULL DEFAULT 'medium',
  spec TEXT,
  acceptance_criteria JSON,
  assigned_agent VARCHAR(50),
  branch_name VARCHAR(255),
  worktree_path VARCHAR(500),
  lease_id VARCHAR(36),
  lease_expires_at DATETIME,
  iteration_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME,
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_priority (priority),
  INDEX idx_lease (lease_id, lease_expires_at)
) ENGINE=InnoDB;

-- 2. Agent logs: all agent activity
CREATE TABLE IF NOT EXISTS agent_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agent_name VARCHAR(50) NOT NULL,
  task_id INT,
  action VARCHAR(100) NOT NULL,
  detail TEXT,
  level ENUM('DEBUG', 'INFO', 'WARN', 'ERROR') NOT NULL DEFAULT 'INFO',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  INDEX idx_agent (agent_name),
  INDEX idx_task (task_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- 3. Agent call log: idempotency for LLM calls
CREATE TABLE IF NOT EXISTS agent_call_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,
  agent_name VARCHAR(50) NOT NULL,
  task_id INT,
  prompt_hash VARCHAR(64) NOT NULL,
  response TEXT,
  duration_ms INT,
  status ENUM('pending', 'success', 'error') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  INDEX idx_idemp (idempotency_key),
  INDEX idx_agent_task (agent_name, task_id)
) ENGINE=InnoDB;

-- 4. Decisions: agreement gate scores
CREATE TABLE IF NOT EXISTS decisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  pass_type ENUM('analyst', 'implementer') NOT NULL,
  iteration INT NOT NULL DEFAULT 1,
  scores JSON NOT NULL,
  quality_score DECIMAL(5,2),
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  reasoning TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  INDEX idx_task_iter (task_id, iteration)
) ENGINE=InnoDB;

-- 5. File locks: prevent concurrent edits
CREATE TABLE IF NOT EXISTS file_locks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_path_hash VARCHAR(64) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  task_id INT NOT NULL,
  agent_name VARCHAR(50) NOT NULL,
  acquired_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  released_at DATETIME,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE INDEX idx_active_lock (file_path_hash, released_at),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- 6. Research: scout findings
CREATE TABLE IF NOT EXISTS research (
  id INT AUTO_INCREMENT PRIMARY KEY,
  topic VARCHAR(255) NOT NULL,
  source VARCHAR(255),
  findings TEXT NOT NULL,
  impact_score DECIMAL(3,1),
  confidence DECIMAL(3,2),
  promoted BOOLEAN NOT NULL DEFAULT FALSE,
  promoted_task_id INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (promoted_task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  INDEX idx_promoted (promoted),
  INDEX idx_impact (impact_score, confidence)
) ENGINE=InnoDB;

-- 7. Test results: per-task test outcomes
CREATE TABLE IF NOT EXISTS test_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  test_type ENUM('unit', 'integration', 'e2e') NOT NULL DEFAULT 'unit',
  total_tests INT NOT NULL DEFAULT 0,
  passed INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  skipped INT NOT NULL DEFAULT 0,
  coverage DECIMAL(5,2),
  report JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  INDEX idx_task (task_id)
) ENGINE=InnoDB;

-- 8. CI results: local CI gate outcomes
CREATE TABLE IF NOT EXISTS ci_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  check_type ENUM('typecheck', 'lint', 'audit', 'prisma_validate', 'build') NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  output TEXT,
  duration_ms INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  INDEX idx_task (task_id)
) ENGINE=InnoDB;

-- 9. Bracket spec sections: tracks completion of bracket specification
CREATE TABLE IF NOT EXISTS bracket_spec_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at DATETIME,
  task_id INT,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
) ENGINE=InnoDB;
