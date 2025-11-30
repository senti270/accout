-- ============================================
-- 대시보드 추가 기능 테이블
-- ============================================

-- 7. Comments (코멘트) 테이블
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_workspace_id ON comments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

CREATE TRIGGER IF NOT EXISTS update_comments_timestamp 
    AFTER UPDATE ON comments
    FOR EACH ROW
BEGIN
    UPDATE comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 8. Comment Attachments (코멘트 첨부파일) 테이블
CREATE TABLE IF NOT EXISTS comment_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment_id ON comment_attachments(comment_id);

-- 9. Todos (할일 목록) 테이블
CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    due_date DATE,
    is_completed BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_todos_workspace_id ON todos(workspace_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_is_completed ON todos(is_completed);

CREATE TRIGGER IF NOT EXISTS update_todos_timestamp 
    AFTER UPDATE ON todos
    FOR EACH ROW
BEGIN
    UPDATE todos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 10. Todo Attachments (할일 첨부파일) 테이블
CREATE TABLE IF NOT EXISTS todo_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    todo_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_todo_attachments_todo_id ON todo_attachments(todo_id);

-- 11. Bookmarks (URL 바로가기) 테이블
CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_workspace_id ON bookmarks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at);

CREATE TRIGGER IF NOT EXISTS update_bookmarks_timestamp 
    AFTER UPDATE ON bookmarks
    FOR EACH ROW
BEGIN
    UPDATE bookmarks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

