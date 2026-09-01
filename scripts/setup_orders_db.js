/**
 * PERINGATAN: Script ini HANYA untuk lingkungan development.
 * TIDAK BOLEH dijalankan di production.
 *
 * Gunakan migrations/ untuk perubahan skema di production.
 *
 * Script ini mereset tabel orders & order_items hanya jika
 * NODE_ENV=development atau NODE_ENV=test.
 */
'use strict';

if (!['development', 'test'].includes(process.env.NODE_ENV)) {
  console.error('ABORT: db:reset hanya boleh dijalankan di development/test.');
  console.error(`NODE_ENV saat ini: "${process.env.NODE_ENV}"`);
  console.error('Set NODE_ENV=development sebelum menjalankan script ini.');
  process.exit(1);
}

const db = require('./config/db');

const steps = [
  'DROP TABLE IF EXISTS order_items',
  'DROP TABLE IF EXISTS orders',
  `CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    table_number VARCHAR(20),
    whatsapp VARCHAR(20),
    notes TEXT,
    total_price DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    payment_status ENUM('Pending','Paid','Failed') DEFAULT 'Pending',
    payment_url TEXT,
    status ENUM('Menunggu','Diproses','Selesai','Dibatalkan') DEFAULT 'Menunggu',
    tracking_token VARCHAR(128) UNIQUE,
    idempotency_key VARCHAR(128) UNIQUE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`,
];

(async () => {
  const conn = await db.promise().getConnection();
  try {
    for (const sql of steps) {
      await conn.query(sql);
      console.log('[OK]', sql.slice(0, 60));
    }
    console.log('Reset tabel orders/order_items selesai (development).');
  } catch (err) {
    console.error('Reset gagal:', err.message);
    process.exit(1);
  } finally {
    conn.release();
    db.end();
  }
})();
