// TIER 1.2 - Jam operasional real-time di navbar
"use client";

import { useEffect, useState } from "react";

// Jam operasional Ilang Arah Coffee (24h format)
const OPEN_HOUR = 10; // 10:00
const CLOSE_HOUR = 23; // 23:00

export default function OperatingStatus() {
  const [status, setStatus] = useState({ open: false, label: "", now: null });

  useEffect(() => {
    const update = () => {
      const d = new Date();
      const h = d.getHours();
      const m = d.getMinutes();
      const current = h + m / 60;
      const isOpen = current >= OPEN_HOUR && current < CLOSE_HOUR;

      let label;
      if (isOpen) {
        const closeH = CLOSE_HOUR;
        label = `🟢 BUKA · Tutup ${pad(closeH)}:00`;
      } else if (current < OPEN_HOUR) {
        label = `🔴 TUTUP · Buka ${pad(OPEN_HOUR)}:00`;
      } else {
        label = `🔴 TUTUP · Buka ${pad(OPEN_HOUR)}:00`;
      }

      setStatus({ open: isOpen, label, now: d });
    };

    update();
    const id = setInterval(update, 30000); // refresh tiap 30 detik
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="hidden lg:flex items-center gap-2 rounded-2xl bg-[#F9F9F9] px-3 py-2 text-[10px] font-bold shadow-[4px_4px_10px_rgba(121,118,118,0.1),-4px_-4px_10px_rgba(255,255,255,1)] cursor-default group relative"
      title="Jam Operasional: 10:00 - 23:00 WIB"
    >
      <span
        className={`h-2 w-2 rounded-full ${
          status.open ? "bg-green-500 animate-pulse" : "bg-red-500"
        }`}
      />
      <span className={status.open ? "text-green-600" : "text-red-500"}>
        {status.label}
      </span>

      {/* Tooltip full hours */}
      <div className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-[#1A1A1A] px-3 py-2 text-[10px] font-medium text-[#F9F9F9] opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
        Senin - Minggu · 10:00 - 23:00 WIB
      </div>
    </div>
  );
}

function pad(n) {
  return String(n).padStart(2, "0");
}