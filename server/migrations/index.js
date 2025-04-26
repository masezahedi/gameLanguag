import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function runMigrations(db) {
  // جدول برای ذخیره تاریخچه migrations
  await createMigrationsTable(db);
  
  // لیست تمام migrations به ترتیب
  const migrations = [
    {
      version: 1,
      name: 'initial_schema',
      up: `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS words (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          english_word TEXT NOT NULL,
          translation TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );
      `
    },
    {
      version: 2,
      name: 'add_leitner_boxes',
      up: `
        CREATE TABLE IF NOT EXISTS leitner_boxes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          word_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          box_number INTEGER DEFAULT 1,
          next_review DATE NOT NULL,
          correct_count INTEGER DEFAULT 0,
          incorrect_count INTEGER DEFAULT 0,
          last_reviewed DATE,
          FOREIGN KEY (word_id) REFERENCES words (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        );
      `
    },
    // اضافه کردن migrations جدید در اینجا
    {
      version: 3,
      name: 'add_word_created_at',
      up: `
        ALTER TABLE words ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
      `
    }
  ];

  // اجرای migrations
  for (const migration of migrations) {
    await runMigration(db, migration);
  }
}

async function createMigrationsTable(db) {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER NOT NULL,
        name TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function runMigration(db, migration) {
  return new Promise((resolve, reject) => {
    // چک کردن آیا این migration قبلاً اجرا شده
    db.get(
      'SELECT * FROM migrations WHERE version = ?',
      [migration.version],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          // این migration قبلاً اجرا شده
          resolve();
          return;
        }

        // اجرای migration
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          
          db.run(migration.up, (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }

            // ثبت migration در جدول migrations
            db.run(
              'INSERT INTO migrations (version, name) VALUES (?, ?)',
              [migration.version, migration.name],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  reject(err);
                  return;
                }

                db.run('COMMIT');
                console.log(`Migration ${migration.version}: ${migration.name} اجرا شد`);
                resolve();
              }
            );
          });
        });
      }
    );
  });
} 