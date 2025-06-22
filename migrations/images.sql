CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  alt TEXT,
  title TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  hash TEXT UNIQUE -- optional: to ensure same image with different URL isn't duplicated
);

-- Link to content (blog/project/other)
CREATE TABLE IF NOT EXISTS image_usage (
  id TEXT PRIMARY KEY,
  image_id TEXT NOT NULL REFERENCES images(id),
  used_in TEXT NOT NULL, -- e.g., 'blog' or 'project'
  target_id TEXT NOT NULL, -- e.g., blog_id or project_id
  FOREIGN KEY (image_id) REFERENCES images(id)
);
