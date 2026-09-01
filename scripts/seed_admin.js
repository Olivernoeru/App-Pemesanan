/**
 * Seed script untuk membuat akun admin pertama.
 * HANYA untuk dijalankan sekali saat setup awal atau development.
 * Jalankan: node scripts/seed_admin.js
 */
'use strict';
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || 'admin@ilangarah.test';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'AdminKopi@2026!';
const ADMIN_NAME     = process.env.SEED_ADMIN_NAME     || 'Admin Kopi Ilang Arah';

(async () => {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const [existing] = await db.promise().query('SELECT id FROM users WHERE email = ?', [ADMIN_EMAIL]);
  if (existing.length) {
    // Update password jika sudah ada
    await db.promise().query('UPDATE users SET password = ?, name = ?, role = ? WHERE email = ?', [hash, ADMIN_NAME, 'admin', ADMIN_EMAIL]);
    console.log('Admin password diperbarui:', ADMIN_EMAIL);
  } else {
    await db.promise().query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [ADMIN_NAME, ADMIN_EMAIL, hash, 'admin']);
    console.log('Admin berhasil dibuat:', ADMIN_EMAIL);
  }
  db.end();
})();