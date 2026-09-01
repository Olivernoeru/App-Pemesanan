'use strict';

/** Migrasi additif konfigurasi minuman; aman dijalankan berulang dan tidak menghapus data. */
const db = require('../config/db');
const statements = [
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS customization_enabled TINYINT(1) NOT NULL DEFAULT 0`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS mood_enabled TINYINT(1) NOT NULL DEFAULT 1`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS hot_available TINYINT(1) NOT NULL DEFAULT 1`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS cold_available TINYINT(1) NOT NULL DEFAULT 1`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS size_enabled TINYINT(1) NOT NULL DEFAULT 1`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS medium_price DECIMAL(10,2) NULL`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS large_price DECIMAL(10,2) NULL`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS jumbo_price DECIMAL(10,2) NULL`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS sugar_enabled TINYINT(1) NOT NULL DEFAULT 1`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS addons_enabled TINYINT(1) NOT NULL DEFAULT 1`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS customization JSON NULL`,
  `CREATE TABLE IF NOT EXISTS addon_categories (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, is_active TINYINT(1) NOT NULL DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS addons (id INT AUTO_INCREMENT PRIMARY KEY, category_id INT NOT NULL, name VARCHAR(100) NOT NULL, price DECIMAL(10,2) NOT NULL DEFAULT 0, is_active TINYINT(1) NOT NULL DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_addon_category_name (category_id, name), CONSTRAINT fk_addons_category FOREIGN KEY (category_id) REFERENCES addon_categories(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS product_addons (product_id INT NOT NULL, addon_id INT NOT NULL, PRIMARY KEY (product_id, addon_id), CONSTRAINT fk_product_addons_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE, CONSTRAINT fk_product_addons_addon FOREIGN KEY (addon_id) REFERENCES addons(id) ON DELETE CASCADE)`,
  `UPDATE products SET customization_enabled = 1, medium_price = price, large_price = price, jumbo_price = price WHERE category IN ('Coffee', 'Non Coffee', 'Arah Series') AND customization_enabled = 0`,
];
(async () => {
 const conn = await db.promise().getConnection();
 try { for (const sql of statements) { await conn.query(sql); console.log('[OK]', sql.slice(0, 72)); } }
 finally { conn.release(); db.end(); }
})().catch((err) => { console.error('Migrasi 003 gagal:', err.message); process.exitCode = 1; });
