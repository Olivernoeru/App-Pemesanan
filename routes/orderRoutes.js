const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Route untuk customer membuat pesanan (tanpa autentikasi)
router.post('/', orderController.createOrder);

// Route lacak pesanan customer (tanpa autentikasi)
router.get('/track', orderController.trackOrder);

// Route khusus admin: mengambil semua pesanan
router.get('/', verifyToken, verifyAdmin, orderController.getAllOrders);

// Route khusus admin: mengambil daftar pelanggan unik
router.get('/customers', verifyToken, verifyAdmin, orderController.getCustomers);

// Route khusus admin: statistik & laporan
router.get('/stats', verifyToken, verifyAdmin, orderController.getOrderStats);

// Route khusus admin: memperbarui status pesanan
router.put('/:id/status', verifyToken, verifyAdmin, orderController.updateOrderStatus);

module.exports = router;
