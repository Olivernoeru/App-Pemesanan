const express = require('express');
const router = express.Router();

// Import semua fungsi dari controller
const { 
    createProduct, 
    getAllProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct 
} = require('../controllers/productController');

const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// ----------------------------------------------------
// ROUTE PUBLIK (Bisa diakses User & Guest tanpa Token)
// ----------------------------------------------------
router.get('/', getAllProducts);        // Lihat semua menu aktif
router.get('/:id', getProductById);     // Lihat detail satu menu

// ----------------------------------------------------
// ROUTE PRIVAT (Khusus Admin, Butuh Token JWT)
// ----------------------------------------------------
router.post('/', verifyToken, verifyAdmin, upload.single('image'), createProduct);
router.put('/:id', verifyToken, verifyAdmin, upload.single('image'), updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, deleteProduct);

module.exports = router;