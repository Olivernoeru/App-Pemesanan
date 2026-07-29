require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // Tambahan buat ngatur path direktori gambar

// Import konfigurasi database
require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes'); // Import route produk lu

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ngebuka akses folder 'public/uploads' biar foto kopi bisa diakses publik lewat URL browser
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Gunakan Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes); // Daftarin route produk

// Route Dasar untuk Test
app.get('/', (req, res) => {
  res.send('API Project FNB is running!');
});

// Jalankan Server
app.listen(port, () => {
  console.log(`Server jalan di http://localhost:${port}`);
});