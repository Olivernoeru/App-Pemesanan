require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // Tambahan buat ngatur path direktori gambar
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import konfigurasi database
const db = require('./config/db');
const { checkDatabase } = require('./config/db');

const categoryRoutes = require('./routes/categoryRoutes'); // Import route kategori

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes'); // Import route produk lu
const notificationRoutes = require('./routes/notificationRoutes');
const orderRoutes = require('./routes/orderRoutes');
const customizationRoutes = require('./routes/customizationRoutes');

const app = express();
const port = process.env.PORT || 5000;

// ── Validasi konfigurasi wajib ──────────────────────────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET tidak ada atau terlalu pendek (minimal 32 karakter).');
  process.exit(1);
}

// ── Security headers ────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Middleware CORS — HARUS di paling atas sebelum routes
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight OPTIONS agar tidak gagal

// ── Body size limit ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false, limit: '256kb' }));

// ── Request ID ──────────────────────────────────────────────────────────────────
app.use((req, _res, next) => { req.id = crypto.randomUUID(); next(); });

// Ngebuka akses folder 'public/uploads' biar foto kopi bisa diakses publik lewat URL browser
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ── Rate limiters ───────────────────────────────────────────────────────────────
const makeLimiter = (windowMs, max, message) => rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { message } });
app.use('/api/auth/login',    makeLimiter(15 * 60 * 1000, 20,  'Terlalu banyak percobaan login. Coba lagi setelah 15 menit.'));
app.use('/api/auth/register', makeLimiter(60 * 60 * 1000, 10,  'Terlalu banyak registrasi. Coba lagi setelah 1 jam.'));
app.use('/api/orders',        makeLimiter(60 * 1000,       30,  'Terlalu banyak permintaan order.'));
app.use('/api/orders/track',  makeLimiter(60 * 1000,       20,  'Terlalu banyak permintaan pelacakan.'));

// ── Routes ──────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes); // Daftarin route produk
app.use('/api/notifications', notificationRoutes); // Daftarin route notifikasi
app.use('/api/orders', orderRoutes); // Daftarin route pesanan
app.use('/api/customization', customizationRoutes); // Konfigurasi minuman & add-on
app.use('/api/categories', categoryRoutes); // Daftarin route kategori

app.get('/', (req, res) => {
  res.send('API Project FNB is running!');
});

// ── Liveness ────────────────────────────────────────────────────────────────────
app.get('/api/health/live', (_req, res) => res.json({ status: 'ok' }));

// ── Readiness (DB check) ────────────────────────────────────────────────────────
app.get('/api/health/ready', async (_req, res) => {
  try {
    await checkDatabase();
    return res.json({ status: 'ok', db: 'connected' });
  } catch {
    return res.status(503).json({ status: 'error', db: 'unavailable' });
  }
});

// ── Global error handler ─────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  const isClient = status < 500;
  if (!isClient) console.error(`[${req.id}] Unhandled error:`, err);
  const body = isClient
    ? { message: err.message }
    : { message: 'Terjadi kesalahan pada server.' };
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'Ukuran file terlalu besar (maks 5 MB).' });
  return res.status(status).json(body);
});

// ── Start server ────────────────────────────────────────────────────────────────
const server = app.listen(port, () => {
  console.log(`Server jalan di http://localhost:${port}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} sudah dipakai.`);
    process.exitCode = 1;
    return;
  }
  console.error('Server gagal dijalankan:', err);
  process.exitCode = 1;
});

// ── Graceful shutdown ───────────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} diterima. Memulai graceful shutdown...`);
  server.close(() => {
    console.log('HTTP server ditutup.');
    db.end(() => {
      console.log('Database pool ditutup. Keluar.');
      process.exit(0);
    });
  });
  setTimeout(() => { console.error('Shutdown timeout. Force exit.'); process.exit(1); }, 10000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));