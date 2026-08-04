const express = require('express');
const router = express.Router();
const { 
    getNotifications, 
    getUnreadCount, 
    markAsRead, 
    markAllAsRead 
} = require('../controllers/notificationController');

// Harus berurutan biar :id gak nabrak 'unread-count' atau 'read-all'
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

module.exports = router;