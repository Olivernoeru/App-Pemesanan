/**
 * Migration 001 – Menambahkan kolom keamanan & integritas ke tabel orders
 * - tracking_token: token acak untuk pelacakan publik (tidak bisa ditebak)
 * - idempotency_key: mencegah order duplikat dari retry/klik ganda
 * - version: optimistic locking antar admin
 *
 * Script ini AMAN dijalankan berulang (idempoten) karena menggunakan ADD COLUMN IF NOT EXISTS.
 * Tidak ada DROP TABLE.
 */
'use strict';

const db = require('../config/db');

const migrations = [
  // Kolom tracking_token unik untuk pelacakan order oleh customer
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_token VARCHAR(128) UNIQUE`,
  // Kolom idempotency_key untuk mencegah double order
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128) UNIQUE`,
  // Kolom version untuk optimistic locking
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1`,
  // Index untuk mempercepat lookup tracking_token
  `CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders (tracking_token)`,
  // Index untuk mempercepat lookup status + created_at (dashboard & filter)
  `CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders (status, created_at)`,
  // Index untuk mempercepat statistik per tanggal
  `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at)`,
  // Index untuk lookup order_items per order
  `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id)`,
];

(async () => {
  console.log('Menjalankan migration 001...');
  const conn = await db.promise().getConnection();
  try {
    for (const sql of migrations) {
      try {
        await conn.query(sql);
        console.log('[OK]', sql.slice(0, 80));
      } catch (err) {
        // 1060 = Duplicate column, 1061 = Duplicate key name – keduanya aman diabaikan
        if ([1060, 1061].includes(err.errno)) {
          console.log('[SKIP duplicate]', sql.slice(0, 80));
        } else {
          throw err;
        }
      }
    }
    console.log('Migration 001 selesai.');
  } finally {
    conn.release();
    db.end();
  }
})();