// TIER 3.3 - FAQ Collapsible
"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  { q: "Apakah bisa pesan untuk diantar?", a: "Ya! Kamu bisa pilih opsi antar saat checkout. Kami melayani area sekitar kedai." },
  { q: "Metode pembayaran apa saja yang tersedia?", a: "Kami mendukung transfer bank (BCA, Mandiri, BNI) serta e-wallet seperti OVO, GoPay, dan DANA." },
  { q: "Bisakah custom level gula/es?", a: "Tentu. Saat memilih menu, kamu bisa atur preferensi gula dan es sesuai selera." },
  { q: "Berapa lama waktu penyajian?", a: "Rata-rata 10-15 menit untuk minuman, dan 15-20 menit untuk makanan panas." },
  { q: "Apakah ada program member?", a: "Ada! Member baru mendapat gratis isi ulang kopi. Tanya barista kami untuk detailnya." },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" className="px-4 sm:px-6 py-16 relative z-10">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-[#F9F9F9] shadow-[4px_4px_10px_rgba(121,118,118,0.1),-4px_-4px_10px_rgba(255,255,255,1)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A373]">
            <HelpCircle size={14} /> FAQ
          </span>
          <h2 className="mt-4 font-montserrat text-3xl sm:text-4xl font-black text-[#1A1A1A]">
            Pertanyaan Umum
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="rounded-2xl bg-[#F9F9F9] shadow-[8px_8px_16px_rgba(121,118,118,0.08),-8px_-8px_16px_rgba(255,255,255,1)] overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-bold text-[#1A1A1A]">{f.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-[#D4A373] transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <p className="px-5 pb-4 text-xs font-medium text-[#797676] leading-relaxed">
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}