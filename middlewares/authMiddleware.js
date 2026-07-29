const jwt = require('jsonwebtoken');

// 1. Fungsi untuk verifikasi token secara umum (User & Admin)
const verifyToken = (req, res, next) => {
    // Ngambil token dari header Authorization (Format standar: "Bearer <token>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Akses ditolak. Token JWT tidak ditemukan!' 
        });
    }

    try {
        // Ngecek apakah token valid pakai kunci rahasia dari .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Nyimpen data hasil decode (kayak id & role) ke object req
        // Biar datanya bisa dipake di controller nanti
        req.user = decoded; 
        
        next(); // Lanjut ke proses atau controller berikutnya
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: 'Akses ditolak. Token tidak valid atau sudah kadaluarsa!' 
        });
    }
};

// 2. Fungsi khusus untuk membatasi akses hanya untuk Admin
const verifyAdmin = (req, res, next) => {
    // Pastikan fungsi verifyToken udah jalan duluan dan nge-set req.user
    if (req.user && req.user.role === 'admin') {
        next(); // Role admin valid, silakan lewat
    } else {
        return res.status(403).json({ 
            success: false, 
            message: 'Akses diblokir. Area ini khusus Admin!' 
        });
    }
};

module.exports = { verifyToken, verifyAdmin };