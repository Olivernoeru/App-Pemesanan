-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 04 Agu 2026
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_fnb_pemesanan`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) DEFAULT 'new_order',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `notifications`
--

INSERT INTO `notifications` (`id`, `order_id`, `title`, `message`, `type`, `is_read`, `created_at`, `read_at`) VALUES
(1, NULL, 'Selamat Datang!', 'Sistem Notifikasi Ilang Arah Admin Panel telah aktif.', 'system', 1, '2026-08-04 15:46:29', '2026-08-04 16:14:38'),
(2, NULL, 'Pesanan Baru', 'Pesanan baru #ORD-001 dengan total Rp45.000', 'new_order', 0, '2026-08-04 15:46:29', NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(100) NOT NULL,
  `table_number` varchar(20) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT 'cash',
  `payment_status` enum('Pending','Paid','Failed') DEFAULT 'Pending',
  `payment_url` text DEFAULT NULL,
  `status` enum('Menunggu','Diproses','Selesai','Dibatalkan') DEFAULT 'Menunggu',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` enum('Coffee','Non Coffee','Arah Series','Arah Toast','Food') NOT NULL DEFAULT 'Coffee',
  `availability_status` enum('available','sold_out') NOT NULL DEFAULT 'available',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `category`, `availability_status`, `is_active`, `price`, `image_url`) VALUES
(1, 'Ice Americano', 'Double shot espresso yang dipadukan dengan air dingin dan es batu, menghadirkan cita rasa kopi yang bold, clean, dan menyegarkan.', 'Coffee', 'available', 1, 29000.00, '/uploads/kopi-1785684637947-557221844.jpg'),
(2, 'Golden Route Toast', 'Roti panggang tebal berisi telur, keju, dan saus creamy. Perpaduan sederhana yang siap menemani saat perut mulai kehilangan arah.', 'Arah Toast', 'available', 1, 47000.00, '/uploads/kopi-1785684683881-413797601.jpg'),
(3, 'Strawberry Matcha Latte', 'Perpaduan matcha premium yang earthy dengan susu creamy dan manisnya strawberry segar. Disajikan dingin dengan tampilan berlapis yang cantik dan menyegarkan.', 'Non Coffee', 'available', 1, 28000.00, '/uploads/kopi-1785867822210-282527580.jpg'),
(4, 'Hojicha Cream Latte', 'Teh hojicha panggang dengan aroma smoky yang khas, dipadukan dengan susu lembut dan creamy foam untuk rasa yang hangat dan menenangkan.', 'Non Coffee', 'available', 1, 27000.00, '/uploads/kopi-1785867855367-744999335.jpg'),
(5, 'Mango Yakult Cloud', 'Perpaduan manis segar mangga dengan rasa creamy dan sedikit asam khas Yakult, disajikan dingin dengan lapisan foam lembut di atasnya.', 'Non Coffee', 'available', 1, 26000.00, '/uploads/kopi-1785867879623-295840471.jpg');

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`) VALUES
(4, 'Admin Kopi Ilang Arah', 'admin@ilangarah.test', '$2b$10$2mdAjKu3wUlVv2Xj/ttoCupurqYzQuJ2mAykkuk0cOxE2U8oiVbT6', 'admin');

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
