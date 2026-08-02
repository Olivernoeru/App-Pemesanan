const multer = require("multer");
const path = require("path");

// 1. Setting tempat penyimpanan dan penamaan file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/"); // Masuk ke folder yang udah lu buat
  },
  filename: function (req, file, cb) {
    // Bikin nama unik: kopi-123456789.jpg (Biar kalau nama file aslinya aneh, server tetep aman)
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      "kopi-" + uniqueSuffix + path.extname(file.originalname).toLowerCase(),
    );
  },
});

// 2. Filter Format File (Lebih santai tapi tetap aman)
const fileFilter = (req, file, cb) => {
  // List format yang diizinkan (mimetype)
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    // Format aman, silakan masuk!
    cb(null, true);
  } else {
    // Format aneh, tendang!
    cb(
      new Error(
        "Format file ditolak! Cuma boleh upload gambar (JPG/PNG/WEBP).",
      ),
      false,
    );
  }
};

// 3. Bungkus semua aturan ke dalam variabel 'upload'
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Batas maksimal 5MB
});

module.exports = upload;
