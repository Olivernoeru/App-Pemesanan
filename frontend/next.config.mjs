import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Tetapkan workspace root secara eksplisit agar lockfile di direktori induk tidak dipakai.
  turbopack: { root: frontendRoot },
  // Nonaktifkan X-Powered-By header
  poweredByHeader: false,
  // Konfigurasi next/image: izinkan domain backend lokal dan avatar eksternal
  images: {
    remotePatterns: [
      {
        // Backend lokal (development)
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        // Avatar placeholder untuk testimonial
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        pathname: '/**',
      },
      {
        // Generator QRIS mockup pada halaman checkout
        protocol: 'https',
        hostname: 'api.qrserver.com',
        pathname: '/v1/create-qr-code/**',
      },
    ],
  },
  // Paksa HTTPS pada production
  async headers() {
    return process.env.NODE_ENV === 'production'
      ? [{ source: '/(.*)', headers: [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] }]
      : [];
  },
};

export default nextConfig;
