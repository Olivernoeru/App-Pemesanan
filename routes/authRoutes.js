const express = require('express');
const router = express.Router();

// Import controller yang udah kita buat sebelumnya
const { register, login, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);

module.exports = router;