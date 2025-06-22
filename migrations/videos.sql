CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  hash TEXT UNIQUE -- optional: to deduplicate by content
);

CREATE TABLE IF NOT EXISTS video_usage (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES videos(id),
  used_in TEXT NOT NULL, -- 'blog' or 'project'
  target_id TEXT NOT NULL, -- blog_id or project_id
  FOREIGN KEY (video_id) REFERENCES videos(id)
);
