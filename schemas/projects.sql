CREATE TABLE IF NOT EXISTS projects (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	assets TEXT NOT NULL,
	thumbnail_url TEXT,
	category TEXT NOT NULL,
	description TEXT,
	likes INTEGER DEFAULT 0,
	created_at TEXT DEFAULT CURRENT_TIMESTAMP
);