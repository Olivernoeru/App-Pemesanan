const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Daftar kategori tetap (sumber kebenaran tunggal untuk kategori produk)
// Disimpan di backend agar frontend tidak perlu hardcode
const CATEGORIES = ['Coffee', 'Non Coffee', 'Arah Series', 'Arah Toast', 'Food'];

// GET /api/categories - Ambil daftar kategori (publik, tanpa auth)
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Berhasil mengambil daftar kategori.',
    data: CATEGORIES
  });
});

// GET /api/categories/with-count - Ambil kategori + jumlah produk aktif (admin only)
router.get('/with-count', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT category, COUNT(*) AS total
       FROM products
       WHERE is_active = 1
       GROUP BY category`
    );

    // Pastikan semua kategori tetap muncul walau belum ada produk
    const result = CATEGORIES.map(cat => {
      const found = rows.find(r => r.category === cat);
      return {
        category: cat,
        total: found ? found.total : 0
      };
    });

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil daftar kategori dengan jumlah produk.',
      data: result
    });
  } catch (error) {
    console.error('Error get categories with count:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kategori.',
      error: error.message
    });
  }
});

module.exports = router;
