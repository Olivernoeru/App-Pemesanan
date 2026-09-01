const multer = require("multer");
const path = require("path");
const fs   = require("fs");

// Direktori sementara di luar static root (validasi dilakukan sebelum pindah ke public/uploads)
const TEMP_DIR = path.join(__dirname, '../temp_uploads');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Magic bytes untuk validasi format gambar sesungguhnya
const IMAGE_SIGNATURES = [
  { mime: 'image/jpeg', sig: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',  sig: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/webp', sig: null, check: (buf) => buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP' },
];

function detectImageMime(filepath) {
  const buf = Buffer.alloc(12);
  const fd  = fs.openSync(filepath, 'r');
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);
  for (const { mime, sig, check } of IMAGE_SIGNATURES) {
    if (sig && sig.every((b, i) => buf[i] === b)) return mime;
    if (check && check(buf)) return mime;
  }
  return null;
}

// Middleware validasi magic bytes – dipasang setelah multer
function validateImageMagic(req, res, next) {
  if (!req.file) return next();
  const detected = detectImageMime(req.file.path);
  if (!detected) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, message: 'File bukan gambar valid (format JPEG/PNG/WEBP).' });
  }
  req.file.detectedMime = detected;
  // Pindahkan dari temp ke public/uploads
  const dest = path.join(__dirname, '../public/uploads', req.file.filename);
  fs.renameSync(req.file.path, dest);
  req.file.path = dest;
  return next();
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TEMP_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      "kopi-" + uniqueSuffix + path.extname(file.originalname).toLowerCase(),
    );
  },
});

const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format file ditolak! Hanya boleh upload gambar (JPG/PNG/WEBP)."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

upload.validateImage = validateImageMagic;
module.exports = upload;
