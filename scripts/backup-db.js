import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../server/database.sqlite');
const backupDir = path.join(__dirname, '../backups');

// ایجاد دایرکتوری backup اگر وجود نداشت
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `database-${timestamp}.sqlite`);

// کپی فایل دیتابیس
fs.copyFileSync(dbPath, backupPath);
console.log(`Backup created at: ${backupPath}`); 