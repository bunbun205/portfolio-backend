CREATE TABLE IF NOT EXISTS projects (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	thumbnail_url TEXT NOT NULL,
	category TEXT NOT NULL,
	description TEXT,
	created_at TEXT DEFAULT CURRENT_TIMESTAMP
);