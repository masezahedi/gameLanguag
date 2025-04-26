import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { runMigrations } from './migrations/index.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function initializeDatabase() {
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  
  // فعال کردن Promise برای توابع دیتابیس
  db.getAsync = function (sql, params) {
    return new Promise((resolve, reject) => {
      this.get(sql, params, function (err, row) {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };

  db.allAsync = function (sql, params) {
    return new Promise((resolve, reject) => {
      this.all(sql, params, function (err, rows) {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  db.runAsync = function (sql, params) {
    return new Promise((resolve, reject) => {
      this.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  };
  
  // ایجاد جداول اصلی
  db.serialize(() => {
    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);
    
    // Create words table
    db.run(`
      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        english_word TEXT NOT NULL,
        translation TEXT NOT NULL,
        created_at DATETIME DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Create leitner_boxes table
    db.run(`
      CREATE TABLE IF NOT EXISTS leitner_boxes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        box_number INTEGER DEFAULT 1,
        next_review DATETIME DEFAULT (datetime('now','localtime')),
        correct_count INTEGER DEFAULT 0,
        incorrect_count INTEGER DEFAULT 0,
        last_reviewed DATETIME DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (word_id) REFERENCES words (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
  });
  
  return db;
}

// تابع اضافه کردن لغت به جعبه لایتنر
export async function addWordToLeitnerBox(db, wordId, userId) {
  const now = new Date().toISOString();
  return db.runAsync(
    `INSERT OR IGNORE INTO leitner_boxes 
     (word_id, user_id, next_review, box_number) 
     VALUES (?, ?, ?, 1)`,
    [wordId, userId, now]
  );
}

// تابع دریافت لغات برای مرور
export async function getWordsForReview(db, userId) {
  const words = await db.allAsync(
    `SELECT w.*, COALESCE(lb.box_number, 1) as box_number, 
            COALESCE(lb.next_review, datetime('now', 'localtime')) as next_review
     FROM words w 
     LEFT JOIN leitner_boxes lb ON w.id = lb.word_id 
     WHERE w.user_id = ?
     ORDER BY lb.next_review ASC`,
    [userId]
  );

  // برای لغات جدید، اضافه کردن به جعبه لایتنر
  for (const word of words) {
    if (!word.box_number) {
      await addWordToLeitnerBox(db, word.id, userId);
      word.box_number = 1;
    }
  }

  return words;
}

// اضافه کردن این تابع جدید
export function initializeLeitnerBoxes(db, userId) {
  return new Promise((resolve, reject) => {
    // اول همه لغات کاربر رو پیدا می‌کنیم
    db.all(
      `SELECT id FROM words WHERE user_id = ?`,
      [userId],
      async (err, words) => {
        if (err) {
          reject(err);
          return;
        }

        // برای هر لغت، اگر در جدول leitner_boxes نیست، اضافه‌اش می‌کنیم
        const now = new Date().toISOString();
        for (const word of words) {
          await new Promise((resolve, reject) => {
            db.run(
              `INSERT OR IGNORE INTO leitner_boxes 
               (word_id, user_id, next_review, box_number) 
               VALUES (?, ?, ?, 1)`,
              [word.id, userId, now],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        }
        resolve();
      }
    );
  });
}

export function cleanupLeitnerBoxes(db) {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM leitner_boxes 
       WHERE word_id NOT IN (SELECT id FROM words)`,
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// تابع جدید برای پاکسازی کامل
export function resetLeitnerSystem(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // حذف جدول قبلی
      db.run(`DROP TABLE IF EXISTS leitner_boxes`, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // ایجاد مجدد جدول
        db.run(`
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
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(word_id, user_id)
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  });
}