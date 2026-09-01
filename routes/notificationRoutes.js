const express = require('express');
const router = express.Router();
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
} = require('../controllers/notificationController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Semua endpoint notifikasi hanya untuk admin yang sudah login
// Harus berurutan biar :id gak nabrak 'unread-count' atau 'read-all'
router.get('/', verifyToken, verifyAdmin, getNotifications);
router.get('/unread-count', verifyToken, verifyAdmin, getUnreadCount);
router.patch('/read-all', verifyToken, verifyAdmin, markAllAsRead);
router.patch('/:id/read', verifyToken, verifyAdmin, markAsRead);

module.exports = router;
