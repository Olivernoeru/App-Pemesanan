// TIER 3.4 - Promo Banner (top of page, sticky)
"use client";

import { useState } from "react";
import { Gift, X } from "lucide-react";

export default function PromoBanner() {
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  return (
    <div className="sticky top-0 z-[60] bg-gradient-to-r from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] px-4 py-2.5 text-center">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-[11px] font-bold text-[#F9F9F9]">
        <Gift size={14} className="text-[#E9C46A]" />
        <span>
          GRATIS ISI ULANG KOPI UNTUK MEMBER BARU! 🎉{" "}
          <a href="#katalog" className="text-[#E9C46A] underline">
            Order Sekarang
          </a>
        </span>
        <button
          onClick={() => setClosed(true)}
          aria-label="Tutup"
          className="absolute right-3 text-[#F9F9F9]/60 hover:text-[#F9F9F9]"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}