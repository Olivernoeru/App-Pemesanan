// TIER 3.2 - How to Order (step-by-step)
"use client";

import { MousePointerClick, SlidersHorizontal, Wallet, PackageCheck } from "lucide-react";

const STEPS = [
  { icon: MousePointerClick, title: "Pilih Menu", desc: "Jelajahi katalog & pilih favoritmu." },
  { icon: SlidersHorizontal, title: "Atur Jumlah", desc: "Tentukan qty & masukkan ke keranjang." },
  { icon: Wallet, title: "Bayar", desc: "Pilih metode pembayaran & lunasi pesanan." },
  { icon: PackageCheck, title: "Terima", desc: "Pesanan siap diambil atau diantar." },
];

export default function HowToOrder() {
  return (
    <section id="cara-pesan" className="px-4 sm:px-6 py-16 relative z-10">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-[#F9F9F9] shadow-[4px_4px_10px_rgba(121,118,118,0.1),-4px_-4px_10px_rgba(255,255,255,1)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A373]">
            Mudah & Cepat
          </span>
          <h2 className="mt-4 font-montserrat text-3xl sm:text-4xl font-black text-[#1A1A1A]">
            Cara Memesan
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="relative rounded-[28px] bg-[#F9F9F9] p-6 shadow-[12px_12px_24px_rgba(121,118,118,0.1),-12px_-12px_24px_rgba(255,255,255,1)] text-center"
            >
              <span className="absolute top-4 right-4 text-2xl font-black text-[#D4A373]/20">
                0{i + 1}
              </span>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F9F9F9] shadow-[6px_6px_12px_rgba(121,118,118,0.12),-6px_-6px_12px_rgba(255,255,255,1)] text-[#D4A373]">
                <s.icon size={24} />
              </div>
              <h3 className="mt-4 font-montserrat text-base font-bold text-[#1A1A1A]">
                {s.title}
              </h3>
              <p className="mt-2 text-[11px] font-medium text-[#797676] leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}