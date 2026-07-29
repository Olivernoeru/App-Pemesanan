const multer = require('multer');
const path = require('path');

// 1. Setup Storage: Mau disimpen di mana dan namanya apa?
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Arahin ke folder public/uploads yang udah lu bikin sebelumnya
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        // Bikin nama file unik: timestamp + angka random + ekstensi asli 
        // (Contoh hasil: 1708999999-123456789.jpg)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// 2. Setup Filter: Cuma boleh terima file gambar
const fileFilter = (req, file, cb) => {
    // Regex tipe file yang diizinkan
    const allowedTypes = /jpeg|jpg|png/;
    
    // Cek ekstensi file
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    // Cek mimetype
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Format file ditolak! Cuma boleh upload gambar (JPG/JPEG/PNG).'), false);
    }
};

// 3. Eksekusi Multer dengan limitasi ukuran maksimal 5MB
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB (Bisa disesuaikan nanti)
    fileFilter: fileFilter
});

module.exports = upload;