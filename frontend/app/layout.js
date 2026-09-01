import { Montserrat, Inter } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Ilang Arah Coffee - Pemesanan",
  description: "Aplikasi Pemesanan FNB Skala Besar - Katalog Menu Ilang Arah Coffee & Eatery",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      {/* Tambahkan suppressHydrationWarning di sini biar kebal dari Extension Browser */}
      <body suppressHydrationWarning className={`${montserrat.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
