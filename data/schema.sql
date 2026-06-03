-- ============================================================
-- D1 Database Schema — OnlyNerds Job Aggregator
-- ============================================================
-- This schema is used by Cloudflare D1 (serverless SQLite).
-- Run this against the D1 database to create all tables.
--
-- Usage:
--   npx wrangler d1 execute job-aggregator-db --file=./schema.sql
-- ============================================================

-- ============================================================
-- Jobs Table (Primary)
-- ============================================================
-- Stores all active job listings.
-- Deduplication is handled by UNIQUE(url) — INSERT OR IGNORE
-- silently skips duplicate URLs.
CREATE TABLE IF NOT EXISTS jobs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  company         TEXT NOT NULL,
  company_slug    TEXT,
  location        TEXT,
  url             TEXT UNIQUE NOT NULL,
  ats             TEXT,
  skill_level     TEXT,
  is_recruiter    INTEGER DEFAULT 0,
  remote          INTEGER DEFAULT 0,
  workplace_type  TEXT,
  department      TEXT,
  employment_type TEXT,
  published_on    TEXT,
  scraped_at      TEXT,
  salary_min      REAL,
  salary_max      REAL,
  salary_currency TEXT DEFAULT 'USD',
  domain          TEXT,
  category        TEXT,
  category_id     INTEGER,
  normalized_role TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_ats ON jobs(ats);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_domain ON jobs(domain);
CREATE INDEX IF NOT EXISTS idx_jobs_published_on ON jobs(published_on);
CREATE INDEX IF NOT EXISTS idx_jobs_scraped_at ON jobs(scraped_at);
CREATE INDEX IF NOT EXISTS idx_jobs_normalized_role ON jobs(normalized_role);
CREATE INDEX IF NOT EXISTS idx_jobs_skill_level ON jobs(skill_level);
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type);
CREATE INDEX IF NOT EXISTS idx_jobs_remote ON jobs(remote);

-- ============================================================
-- Apply Clicks Table
-- ============================================================
-- Tracks when users click "Apply" on job listings.
CREATE TABLE IF NOT EXISTS apply_clicks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  job_url     TEXT NOT NULL,
  title       TEXT,
  company     TEXT,
  clicked_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_apply_clicks_job_url ON apply_clicks(job_url);
CREATE INDEX IF NOT EXISTS idx_apply_clicks_clicked_at ON apply_clicks(clicked_at);

-- ============================================================
-- Jobs Analytics Table
-- ============================================================
-- Per-domain, per-category, per-role breakdown snapshots.
CREATE TABLE IF NOT EXISTS jobs_analytics (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date   TEXT NOT NULL,
  domain          TEXT,
  category        TEXT,
  category_id     INTEGER,
  normalized_role TEXT,
  total_jobs      INTEGER DEFAULT 0,
  active_jobs     INTEGER DEFAULT 0,
  stale_jobs      INTEGER DEFAULT 0,
  top_companies   TEXT
);

CREATE INDEX IF NOT EXISTS idx_jobs_analytics_snapshot ON jobs_analytics(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_jobs_analytics_domain ON jobs_analytics(domain);

-- ============================================================
-- Companies Analytics Table
-- ============================================================
-- Per-company posting pattern snapshots.
CREATE TABLE IF NOT EXISTS companies_analytics (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date       TEXT NOT NULL,
  company             TEXT NOT NULL,
  total_jobs_posted   INTEGER DEFAULT 0,
  active_jobs         INTEGER DEFAULT 0,
  stale_jobs          INTEGER DEFAULT 0,
  jobs_this_month     INTEGER DEFAULT 0,
  jobs_this_quarter   INTEGER DEFAULT 0,
  jobs_this_year      INTEGER DEFAULT 0,
  avg_job_age_days    INTEGER DEFAULT 0,
  most_common_category TEXT,
  most_common_role    TEXT
);

CREATE INDEX IF NOT EXISTS idx_companies_analytics_snapshot ON companies_analytics(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_companies_analytics_company ON companies_analytics(company);

-- ============================================================
-- Archived Jobs Table
-- ============================================================
-- Jobs that have been archived (moved from active jobs table).
CREATE TABLE IF NOT EXISTS archived_jobs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  company         TEXT NOT NULL,
  url             TEXT UNIQUE NOT NULL,
  archived_at     TEXT DEFAULT (datetime('now')),
  archive_reason  TEXT DEFAULT 'age'
);

CREATE INDEX IF NOT EXISTS idx_archived_jobs_archived_at ON archived_jobs(archived_at);

-- ============================================================
-- Promoted Tags Table
-- ============================================================
-- Tags that can be applied to jobs for promotion/featured status.
CREATE TABLE IF NOT EXISTS promoted_tags (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tag_name    TEXT UNIQUE NOT NULL,
  tag_type    TEXT NOT NULL DEFAULT 'promoted',
  created_at  TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- Job Tags Table (Many-to-Many)
-- ============================================================
-- Links jobs to promoted tags.
CREATE TABLE IF NOT EXISTS job_tags (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  job_url TEXT NOT NULL,
  tag_id  INTEGER NOT NULL,
  FOREIGN KEY (tag_id) REFERENCES promoted_tags(id),
  UNIQUE(job_url, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_job_tags_job_url ON job_tags(job_url);

-- ============================================================
-- Admin Jobs Table
-- ============================================================
-- Manually added jobs by administrators.
CREATE TABLE IF NOT EXISTS admin_jobs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  company     TEXT NOT NULL,
  url         TEXT UNIQUE NOT NULL,
  created_at  TEXT DEFAULT (datetime('now'))
);
