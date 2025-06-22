CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  model_url TEXT NOT NULL,
  preview_url TEXT,
  format TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  category TEXT,
  project_id TEXT
);
