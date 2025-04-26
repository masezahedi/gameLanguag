import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initializeDatabase, addWordToLeitnerBox, initializeLeitnerBoxes, getWordsForReview, cleanupLeitnerBoxes, resetLeitnerSystem } from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const db = initializeDatabase();
const JWT_SECRET = 'your_jwt_secret_key';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.status(401).json({ message: 'توکن احراز هویت ارائه نشده است' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'توکن نامعتبر است' });
    req.user = user;
    next();
  });
};

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'نام کاربری و رمز عبور الزامی هستند' });
    }
    
    // Check if username already exists
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'خطا در بررسی نام کاربری' });
      }
      
      if (row) {
        return res.status(400).json({ message: 'این نام کاربری قبلاً استفاده شده است' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert user into database
      db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'خطا در ثبت‌نام' });
          }
          
          res.status(201).json({ message: 'ثبت‌نام با موفقیت انجام شد' });
        }
      );
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'خطای سرور' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'نام کاربری و رمز عبور الزامی هستند' });
    }
    
    // Find user
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'خطا در بررسی نام کاربری' });
      }
      
      if (!user) {
        return res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است' });
      }
      
      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        return res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است' });
      }
      
      // Generate JWT
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'خطای سرور' });
  }
});

// Get all words for a user
app.get('/api/words', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM words WHERE user_id = ? ORDER BY id DESC',
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'خطا در دریافت لغات' });
      }
      
      res.json(rows);
    }
  );
});

// Get word count for a user
app.get('/api/words/count', authenticateToken, (req, res) => {
  db.get(
    'SELECT COUNT(*) as count FROM words WHERE user_id = ?',
    [req.user.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'خطا در دریافت تعداد لغات' });
      }
      
      res.json({ count: row.count });
    }
  );
});

// Add a new word
app.post('/api/words', authenticateToken, async (req, res) => {
  const { english_word, translation } = req.body;
  
  if (!english_word || !translation) {
    return res.status(400).json({ message: 'لغت انگلیسی و ترجمه الزامی هستند' });
  }
  
  try {
    // استفاده از Promise برای اطمینان از ترتیب عملیات‌ها
    const wordId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO words (user_id, english_word, translation) VALUES (?, ?, ?)',
        [req.user.id, english_word, translation],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // اضافه کردن به جعبه لایتنر
    await addWordToLeitnerBox(db, wordId, req.user.id);
    
    res.status(201).json({
      id: wordId,
      user_id: req.user.id,
      english_word,
      translation
    });
  } catch (err) {
    console.error('خطا در افزودن لغت:', err);
    res.status(500).json({ message: 'خطا در افزودن لغت' });
  }
});

// Update a word
app.put('/api/words/:id', authenticateToken, (req, res) => {
  const { english_word, translation } = req.body;
  const wordId = req.params.id;
  
  if (!english_word || !translation) {
    return res.status(400).json({ message: 'لغت انگلیسی و ترجمه الزامی هستند' });
  }
  
  // First check if the word belongs to the user
  db.get(
    'SELECT * FROM words WHERE id = ? AND user_id = ?',
    [wordId, req.user.id],
    (err, word) => {
      if (err) {
        return res.status(500).json({ message: 'خطا در بررسی لغت' });
      }
      
      if (!word) {
        return res.status(404).json({ message: 'لغت مورد نظر یافت نشد' });
      }
      
      // Update the word
      db.run(
        'UPDATE words SET english_word = ?, translation = ? WHERE id = ? AND user_id = ?',
        [english_word, translation, wordId, req.user.id],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'خطا در ویرایش لغت' });
          }
          
          res.json({
            id: wordId,
            user_id: req.user.id,
            english_word,
            translation
          });
        }
      );
    }
  );
});

// Delete a word
app.delete('/api/words/:id', authenticateToken, (req, res) => {
  const wordId = req.params.id;
  
  // First check if the word belongs to the user
  db.get(
    'SELECT * FROM words WHERE id = ? AND user_id = ?',
    [wordId, req.user.id],
    (err, word) => {
      if (err) {
        return res.status(500).json({ message: 'خطا در بررسی لغت' });
      }
      
      if (!word) {
        return res.status(404).json({ message: 'لغت مورد نظر یافت نشد' });
      }
      
      // Delete the word
      db.run(
        'DELETE FROM words WHERE id = ? AND user_id = ?',
        [wordId, req.user.id],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'خطا در حذف لغت' });
          }
          
          res.json({ message: 'لغت با موفقیت حذف شد' });
        }
      );
    }
  );
});

// Get random cards for game
app.get('/api/game/cards', authenticateToken, (req, res) => {
  const pairs = parseInt(req.query.pairs) || 4;
  
  if (isNaN(pairs) || pairs < 1) {
    return res.status(400).json({ message: 'تعداد جفت‌ها باید یک عدد مثبت باشد' });
  }
  
  // Get random words
  db.all(
    'SELECT id, english_word, translation FROM words WHERE user_id = ? ORDER BY RANDOM() LIMIT ?',
    [req.user.id, pairs],
    (err, words) => {
      if (err) {
        return res.status(500).json({ message: 'خطا در دریافت لغات' });
      }
      
      if (words.length < 1) {
        return res.status(400).json({ message: 'لغات کافی برای بازی وجود ندارد' });
      }
      
      // Create cards (one for english, one for translation)
      const cards = [];
      
      words.forEach(word => {
        // English card
        cards.push({
          type: 'english',
          word: word.english_word,
          pairId: word.id
        });
        
        // Translation card
        cards.push({
          type: 'translation',
          word: word.translation,
          pairId: word.id
        });
      });
      
      // Shuffle cards
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
      
      res.json(cards);
    }
  );
});

// اضافه کردن این مسیر جدید
app.post('/api/leitner/initialize', authenticateToken, async (req, res) => {
  try {
    await initializeLeitnerBoxes(db, req.user.id);
    res.json({ message: 'جعبه‌های لایتنر با موفقیت راه‌اندازی شدند' });
  } catch (err) {
    console.error('خطا در راه‌اندازی جعبه‌های لایتنر:', err);
    res.status(500).json({ error: 'خطا در راه‌اندازی جعبه‌های لایتنر' });
  }
});

// اضافه کردن مسیر جدید برای ریست کردن سیستم
app.post('/api/leitner/reset', authenticateToken, async (req, res) => {
  try {
    await resetLeitnerSystem(db);
    res.json({ message: 'سیستم لایتنر با موفقیت ریست شد' });
  } catch (err) {
    console.error('خطا در ریست کردن سیستم لایتنر:', err);
    res.status(500).json({ error: 'خطا در ریست کردن سیستم' });
  }
});

// مسیر دریافت لغات برای مرور
app.get('/api/leitner/words-for-review', authenticateToken, async (req, res) => {
  try {
    const words = await db.allAsync(
      `SELECT w.*, lb.box_number, lb.next_review 
       FROM words w 
       LEFT JOIN leitner_boxes lb ON w.id = lb.word_id AND lb.user_id = w.user_id
       WHERE w.user_id = ? AND 
             (lb.next_review IS NULL OR lb.next_review <= datetime('now', 'localtime'))
       ORDER BY lb.next_review ASC`,
      [req.user.id]
    );

    // برای لغات جدید، اضافه کردن به جعبه لایتنر
    for (const word of words) {
      if (!word.box_number) {
        await addWordToLeitnerBox(db, word.id, req.user.id);
        word.box_number = 1;
      }
    }

    res.json(words);
  } catch (err) {
    console.error('خطا در دریافت لغات:', err);
    res.status(500).json({ error: 'خطا در دریافت لغات' });
  }
});

// مسیر ثبت پاسخ کاربر
app.post('/api/leitner/answer', authenticateToken, async (req, res) => {
  try {
    const { wordId, isCorrect } = req.body;
    const userId = req.user.id;

    // دریافت وضعیت فعلی لغت
    const row = await db.getAsync(
      'SELECT box_number FROM leitner_boxes WHERE word_id = ? AND user_id = ?',
      [wordId, userId]
    );

    const currentBox = row ? row.box_number : 1;
    let newBox = currentBox;
    let nextReview = new Date();

    if (isCorrect) {
      newBox = Math.min(currentBox + 1, 5);
      switch (newBox) {
        case 1: nextReview.setMinutes(nextReview.getMinutes() + 5); break;
        case 2: nextReview.setHours(nextReview.getHours() + 8); break;
        case 3: nextReview.setDate(nextReview.getDate() + 1); break;
        case 4: nextReview.setDate(nextReview.getDate() + 3); break;
        case 5: nextReview.setDate(nextReview.getDate() + 7); break;
      }
    } else {
      newBox = 1;
      nextReview.setMinutes(nextReview.getMinutes() + 5);
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO leitner_boxes 
       (word_id, user_id, box_number, next_review) 
       VALUES (?, ?, ?, ?)`,
      [wordId, userId, newBox, nextReview.toISOString()]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('خطا در ثبت پاسخ:', err);
    res.status(500).json({ error: 'خطا در ثبت پاسخ' });
  }
});

// مسیر دریافت آمار
app.get('/api/leitner/stats', authenticateToken, async (req, res) => {
  try {
    db.all(
      `SELECT lb.box_number, COUNT(*) as count 
       FROM words w 
       LEFT JOIN leitner_boxes lb ON w.id = lb.word_id 
       WHERE w.user_id = ? 
       GROUP BY lb.box_number`,
      [req.user.id],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'خطا در دریافت آمار' });
        }
        
        const stats = {
          box1: 0,
          box2: 0,
          box3: 0,
          box4: 0,
          box5: 0
        };
        
        rows.forEach(row => {
          if (row.box_number >= 1 && row.box_number <= 5) {
            stats[`box${row.box_number}`] = row.count;
          } else {
            // اگر box_number نداشت، در جعبه 1 قرار می‌گیرد
            stats.box1 += row.count;
          }
        });
        
        res.json(stats);
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت آمار' });
  }
});

// اضافه کردن یک مسیر برای دریافت تعداد کل لغات
app.get('/api/words/total', authenticateToken, (req, res) => {
  db.get(
    'SELECT COUNT(*) as total FROM words WHERE user_id = ?',
    [req.user.id],
    (err, row) => {
      if (err) {
        console.error('خطا در شمارش لغات:', err);
        return res.status(500).json({ error: 'خطا در شمارش لغات' });
      }
      res.json({ total: row.total });
    }
  );
});

// در بخش initialize یا startup
app.post('/api/leitner/cleanup', authenticateToken, async (req, res) => {
  try {
    await cleanupLeitnerBoxes(db);
    res.json({ message: 'پاکسازی با موفقیت انجام شد' });
  } catch (err) {
    res.status(500).json({ error: 'خطا در پاکسازی دیتابیس' });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});