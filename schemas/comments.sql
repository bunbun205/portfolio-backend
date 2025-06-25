CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY NOT NULL, -- UUID
  user_id TEXT NOT NULL, -- From users_db.users
  post_id TEXT NOT NULL, -- blog_posts.id or projects.id
  content TEXT NOT NULL,
  parent_comment_id TEXT, -- For replies
  likes INTEGER DEFAULT 0,
  flags INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
