-- AditShopLog initial schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  jira_key VARCHAR(255) NOT NULL,
  ticket_name VARCHAR(255) NOT NULL,
  writer_id INTEGER NOT NULL REFERENCES users(id),
  assignee VARCHAR(255),
  written_date DATE,
  deploy_date DATE,
  aditshop_branch_note TEXT,
  newbqr_branch_note TEXT,
  related_links TEXT,
  status VARCHAR(255),
  dev_merge_status VARCHAR(255),
  capture_upload_status VARCHAR(255),
  last_modified_by INTEGER REFERENCES users(id),
  last_modified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_jira_key ON tickets(jira_key);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_name ON tickets(ticket_name);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee);
CREATE INDEX IF NOT EXISTS idx_tickets_deploy_date ON tickets(deploy_date);

CREATE TABLE IF NOT EXISTS remarks (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_remarks_ticket_id ON remarks(ticket_id);

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) UNIQUE NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT NOW()
);
