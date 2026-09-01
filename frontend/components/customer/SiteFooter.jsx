// TIER 2.3 - Expanded Footer (social media + newsletter)
"use client";

import { useState } from "react";
import { Camera, Globe, MessageCircle, Music2, Send, Coffee } from "lucide-react";

export default function SiteFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const onSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <footer className="px-4 sm:px-6 py-12 relative z-10">
      <div className="mx-auto max-w-7xl rounded-[32px] bg-[#F9F9F9] p-8 sm:p-10 shadow-[12px_12px_24px_rgba(121,118,118,0.1),-12px_-12px_24px_rgba(255,255,255,1)] grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Company Info */}
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F9F9F9] shadow-[6px_6px_12px_rgba(121,118,118,0.15),-6px_-6px_12px_rgba(255,255,255,1)] text-[#D4A373]">
              <Coffee size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-montserrat text-base font-black tracking-widest text-[#1A1A1A]">
                ILANG ARAH
              </h3>
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#D4A373]">
                Coffee & Eatery
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs font-medium text-[#797676] leading-relaxed max-w-xs">
            Menyeduh cerita setiap hari dengan biji kopi lokal premium. Tempat
            nyaman untuk bekerja, ngobrol, dan menikmati hidup.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F9F9F9] shadow-[4px_4px_10px_rgba(121,118,118,0.12),-4px_-4px_10px_rgba(255,255,255,1)] text-[#797676] hover:text-[#D4A373] transition-all active:scale-95">
              <Camera size={16} />
            </a>
            <a href="#" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F9F9F9] shadow-[4px_4px_10px_rgba(121,118,118,0.12),-4px_-4px_10px_rgba(255,255,255,1)] text-[#797676] hover:text-[#D4A373] transition-all active:scale-95">
              <MessageCircle size={16} />
            </a>
            <a href="#" aria-label="TikTok" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F9F9F9] shadow-[4px_4px_10px_rgba(121,118,118,0.12),-4px_-4px_10px_rgba(255,255,255,1)] text-[#797676] hover:text-[#D4A373] transition-all active:scale-95">
              <Music2 size={16} />
            </a>
            <a href="#" aria-label="Twitter" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F9F9F9] shadow-[4px_4px_10px_rgba(121,118,118,0.12),-4px_-4px_10px_rgba(255,255,255,1)] text-[#797676] hover:text-[#D4A373] transition-all active:scale-95">
              <Globe size={16} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-montserrat text-sm font-bold text-[#1A1A1A] mb-4">
            Quick Links
          </h4>
          <ul className="space-y-2.5 text-xs font-medium text-[#797676]">
            <li><a href="#" className="hover:text-[#D4A373] transition-colors">Home</a></li>
            <li><a href="#katalog" className="hover:text-[#D4A373] transition-colors">Menu</a></li>
            <li><a href="#tentang" className="hover:text-[#D4A373] transition-colors">About</a></li>
            <li><a href="#lokasi" className="hover:text-[#D4A373] transition-colors">Contact</a></li>
            <li><a href="/cek-pesanan" className="hover:text-[#D4A373] transition-colors">Order Status</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-montserrat text-sm font-bold text-[#1A1A1A] mb-4">
            Newsletter
          </h4>
          <p className="text-xs font-medium text-[#797676] leading-relaxed mb-4">
            Subscribe untuk update promo & menu baru langsung ke email kamu.
          </p>
          <form onSubmit={onSubscribe} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@kamu.com"
              className="flex-1 rounded-2xl bg-[#F9F9F9] px-4 py-3 text-xs font-medium text-[#1A1A1A] shadow-[inset_4px_4px_8px_rgba(121,118,118,0.12),inset_-4px_-4px_8px_rgba(255,255,255,1)] outline-none focus:ring-2 focus:ring-[#D4A373]/40"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-1 rounded-2xl bg-[#1A1A1A] px-4 py-3 text-xs font-bold text-[#F9F9F9] hover:bg-[#D4A373] transition-colors active:scale-95"
            >
              <Send size={14} /> Subscribe
            </button>
          </form>
          {subscribed && (
            <p className="mt-2 text-[11px] font-bold text-green-600">
              ✓ Terima kasih sudah subscribe!
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <p className="text-[11px] font-bold text-[#797676] text-center">
          © {new Date().getFullYear()} Ilang Arah Coffee. Crafted with Passion.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="#katalog"
            className="text-[11px] font-bold text-[#D4A373] hover:underline"
          >
            Kembali ke Menu ↑
          </a>
        </div>
      </div>
    </footer>
  );
}