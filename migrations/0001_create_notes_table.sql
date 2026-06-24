-- Migration number: 0001 	 2026-06-24T03:38:19.271Z
CREATE TABLE notes (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  content TEXT NOT NULL DEFAULT '' CHECK (length(content) <= 5000),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
