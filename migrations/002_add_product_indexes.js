/**
 * Migration 002 – Index untuk tabel products
 * Mempercepat query pencarian, filter status, dan kategori.
 */
'use strict';

const db = require('../config/db');

const migrations = [
  `CREATE INDEX IF NOT EXISTS idx_products_is_active ON products (is_active)`,
  `CREATE INDEX IF NOT EXISTS idx_products_avail ON products (availability_status, is_active)`,
];

(async () => {
  console.log('Menjalankan migration 002...');
  const conn = await db.promise().getConnection();
  try {
    for (const sql of migrations) {
      try {
        await conn.query(sql);
        console.log('[OK]', sql.slice(0, 80));
      } catch (err) {
        if ([1060, 1061].includes(err.errno)) console.log('[SKIP]', sql.slice(0, 80));
        else throw err;
      }
    }
    console.log('Migration 002 selesai.');
  } finally {
    conn.release();
    db.end();
  }
})();