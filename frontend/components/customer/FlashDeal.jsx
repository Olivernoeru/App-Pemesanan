// TIER 1.3 - Flash Deal / Daily Special dengan countdown
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Zap, Clock, ArrowRight } from "lucide-react";
import { API_BASE_URL, getImageUrl } from "../../lib/api";

// Countdown ke akhir hari (23:00)
function useCountdown() {
  const [time, setTime] = useState({ h: "00", m: "00", s: "00" });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 0, 0, 0);
      let diff = Math.max(0, end - now);
      const h = Math.floor(diff / 3.6e6);
      const m = Math.floor((diff % 3.6e6) / 6e4);
      const s = Math.floor((diff % 6e4) / 1000);
      setTime({
        h: String(h).padStart(2, "0"),
        m: String(m).padStart(2, "0"),
        s: String(s).padStart(2, "0"),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function FlashDeal({ products = [] }) {
  const time = useCountdown();
  // Ambil maksimal 3 produk yang punya diskon
  const deals = products
    .filter((p) => p.discount_price && p.discount_price < p.price)
    .slice(0, 3);

  if (deals.length === 0) return null;

  return (
    <section id="flash-deal" className="px-4 sm:px-6 py-14 relative z-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#D4A373] to-[#E9C46A] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg">
              <Zap size={14} fill="currentColor" /> Penawaran Khusus Hari Ini
            </span>
            <h2 className="mt-4 font-montserrat text-3xl sm:text-4xl font-black text-[#1A1A1A]">
              ⚡ Flash Deal
            </h2>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#D4A373]" />
            <span className="text-[11px] font-bold text-[#797676]">Berakhir dalam</span>
            <div className="flex items-center gap-1">
              {[time.h, time.m, time.s].map((v, i) => (
                <span
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1A1A1A] text-sm font-black text-[#F9F9F9] tabular-nums"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((p) => {
            const disc = Math.round((1 - p.discount_price / p.price) * 100);
            return (
              <a
                key={p.id}
                href="#katalog"
                className="group relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#D4A373]/15 to-[#E9C46A]/10 p-5 shadow-[12px_12px_24px_rgba(121,118,118,0.12),-12px_-12px_24px_rgba(255,255,255,1)] transition-all hover:-translate-y-1"
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-[#D4A373]/20 blur-3xl pointer-events-none" />
                <span className="absolute top-4 left-4 z-10 rounded-full bg-[#1A1A1A] px-3 py-1 text-[10px] font-black text-[#E9C46A]">
                  DISKON {disc}%
                </span>

                <div className="relative mt-10 flex gap-4 items-center">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#F9F9F9] shadow-inner">
                    {p.image_url ? (
                      <Image
                        src={getImageUrl(p.image_url)}
                        alt={p.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#D4A373]">
                        <Zap size={28} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-montserrat text-lg font-bold text-[#1A1A1A] truncate">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-[#797676] line-clamp-2 mt-1">
                      {p.description}
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-[11px] font-medium text-[#797676] line-through">
                        Rp {Number(p.price).toLocaleString("id-ID")}
                      </span>
                      <span className="text-lg font-black text-[#D4A373]">
                        Rp {Number(p.discount_price).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#1A1A1A] py-3 text-xs font-bold text-[#F9F9F9] transition-colors group-hover:bg-[#D4A373]">
                  Pesan Sekarang <ArrowRight size={14} />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}