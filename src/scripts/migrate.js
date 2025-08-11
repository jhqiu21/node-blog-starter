import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db/pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    const sqlPath = path.join(__dirname, '../db/migrations/001_init.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');

    const statements = sql
      .split(/;\s*$/m)
      .map(s => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await pool.query(stmt);
    }

    console.log('✅ Migration completed.');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
})();
