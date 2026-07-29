const express = require('express');
const router = express.Router();

// Import controller yang udah kita buat sebelumnya
const { register, login } = require('../controllers/authController');

// Route untuk Register User Baru
router.post('/register', register);

// Route untuk Login User & Admin
router.post('/login', login);

// Export router supaya bisa dipakai di server.js
module.exports = router;