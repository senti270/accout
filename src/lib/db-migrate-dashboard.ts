/**
 * 대시보드 테이블 마이그레이션 스크립트
 * 기존 데이터베이스에 comments, todos, bookmarks 테이블 추가
 */

import { getDatabase, getDatabaseType } from "./db";

/**
 * 대시보드 테이블 마이그레이션 (comments, todos, bookmarks)
 */
export async function migrateDashboardTables(): Promise<void> {
  const dbType = getDatabaseType();
  const db = getDatabase();

  try {
    if (dbType === "turso" || dbType === "sqlite") {
      // SQLite/Turso: comments 테이블 추가
      await db.execute(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workspace_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )
      `);
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_comments_workspace_id ON comments(workspace_id)"
      );
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at)"
      );
      await db.execute(`
        CREATE TRIGGER IF NOT EXISTS update_comments_timestamp 
          AFTER UPDATE ON comments
          FOR EACH ROW
        BEGIN
          UPDATE comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `);

      // comment_attachments 테이블 추가
      await db.execute(`
        CREATE TABLE IF NOT EXISTS comment_attachments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          comment_id INTEGER NOT NULL,
          image_url TEXT NOT NULL,
          file_name TEXT,
          file_size INTEGER,
          mime_type TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
        )
      `);
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment_id ON comment_attachments(comment_id)"
      );

      // todos 테이블 추가
      await db.execute(`
        CREATE TABLE IF NOT EXISTS todos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workspace_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          content TEXT,
          due_date DATE,
          is_completed INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )
      `);
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_todos_workspace_id ON todos(workspace_id)"
      );
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date)"
      );
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_todos_is_completed ON todos(is_completed)"
      );
      await db.execute(`
        CREATE TRIGGER IF NOT EXISTS update_todos_timestamp 
          AFTER UPDATE ON todos
          FOR EACH ROW
        BEGIN
          UPDATE todos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `);

      // todo_attachments 테이블 추가
      await db.execute(`
        CREATE TABLE IF NOT EXISTS todo_attachments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          todo_id INTEGER NOT NULL,
          image_url TEXT NOT NULL,
          file_name TEXT,
          file_size INTEGER,
          mime_type TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
        )
      `);
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_todo_attachments_todo_id ON todo_attachments(todo_id)"
      );

      // bookmarks 테이블 추가
      await db.execute(`
        CREATE TABLE IF NOT EXISTS bookmarks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workspace_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          url TEXT NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )
      `);
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_bookmarks_workspace_id ON bookmarks(workspace_id)"
      );
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at)"
      );
      await db.execute(`
        CREATE TRIGGER IF NOT EXISTS update_bookmarks_timestamp 
          AFTER UPDATE ON bookmarks
          FOR EACH ROW
        BEGIN
          UPDATE bookmarks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `);
    } else {
      // PostgreSQL: comments 테이블 추가
      await db.execute(`
        CREATE TABLE IF NOT EXISTS comments (
          id SERIAL PRIMARY KEY,
          workspace_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )
      `);
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_comments_workspace_id ON comments(workspace_id)"
      );
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at)"
      );
      await db.execute(`
        DROP TRIGGER IF EXISTS update_comments_timestamp ON comments
      `);
      await db.execute(`
        CREATE TRIGGER update_comments_timestamp 
          BEFORE UPDATE ON comments
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `);

      // comment_attachments 테이블 추가
      await db.execute(`
        CREATE TABLE IF NOT EXISTS comment_attachments (
          id SERIAL PRIMARY KEY,
          comment_id INTEGER NOT NULL,
          image_url TEXT NOT NULL,
          file_name VARCHAR(255),
          file_size INTEGER,
          mime_type VARCHAR(100),
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
        )
      `);
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment_id ON comment_attachments(comment_id)"
      );

      // todos 테이블 추가
      await db.execute(`
        CREATE TABLE IF NOT EXISTS todos (
          id SERIAL PRIMARY KEY,
          workspace_id INTEGER NOT NULL,
          title VARCHAR(255) NOT NULL,
          content TEXT,
          due_date DATE,
          is_completed BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )
      `);
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_todos_workspace_id ON todos(workspace_id)"
      );
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date)"
      );
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_todos_is_completed ON todos(is_completed)"
      );
      await db.execute(`
        DROP TRIGGER IF EXISTS update_todos_timestamp ON todos
      `);
      await db.execute(`
        CREATE TRIGGER update_todos_timestamp 
          BEFORE UPDATE ON todos
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `);

      // todo_attachments 테이블 추가
      await db.execute(`
        CREATE TABLE IF NOT EXISTS todo_attachments (
          id SERIAL PRIMARY KEY,
          todo_id INTEGER NOT NULL,
          image_url TEXT NOT NULL,
          file_name VARCHAR(255),
          file_size INTEGER,
          mime_type VARCHAR(100),
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
        )
      `);
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_todo_attachments_todo_id ON todo_attachments(todo_id)"
      );

      // bookmarks 테이블 추가
      await db.execute(`
        CREATE TABLE IF NOT EXISTS bookmarks (
          id SERIAL PRIMARY KEY,
          workspace_id INTEGER NOT NULL,
          title VARCHAR(255) NOT NULL,
          url TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )
      `);
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_bookmarks_workspace_id ON bookmarks(workspace_id)"
      );
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at)"
      );
      await db.execute(`
        DROP TRIGGER IF EXISTS update_bookmarks_timestamp ON bookmarks
      `);
      await db.execute(`
        CREATE TRIGGER update_bookmarks_timestamp 
          BEFORE UPDATE ON bookmarks
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `);
    }

    console.log("✅ 대시보드 테이블 마이그레이션 완료 (comments, todos, bookmarks)");
  } catch (error) {
    console.error("❌ 대시보드 테이블 마이그레이션 실패:", error);
    throw error;
  }
}

