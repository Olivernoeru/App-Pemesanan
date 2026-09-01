// TIER 1.4 - Customer Testimonials / Reviews
"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Budi Santoso",
    role: "Karyawan",
    rating: 5,
    quote:
      "Kopinya enak banget, V60-nya pas. Tempatnya cozy buat kerja sambil nugas. Bakal balik lagi!",
    avatar: "https://i.pravatar.cc/120?img=12",
  },
  {
    name: "Siti Maharani",
    role: "Mahasiswa",
    rating: 5,
    quote:
      "Croissantnya fresh, kopinya nyaman di lidah. Pelayanannya ramah dan cepat. Recommended!",
    avatar: "https://i.pravatar.cc/120?img=45",
  },
  {
    name: "Andre Wijaya",
    role: "Freelancer",
    rating: 4,
    quote:
      "Suasana tenang, WiFi kencang. Latte art-nya cakep. Cuma agak ramai di weekend.",
    avatar: "https://i.pravatar.cc/120?img=33",
  },
  {
    name: "Dewi Lestari",
    role: "Ibu Rumah Tangga",
    rating: 5,
    quote:
      "Espresso toniknya segar banget buat siang hari. Anak-anak juga suka cake-nya.",
    avatar: "https://i.pravatar.cc/120?img=20",
  },
  {
    name: "Rizki Pratama",
    role: "Desainer",
    rating: 5,
    quote:
      "Cold brew-nya smooth, nggak terlalu asam. Tempatnya aesthetic buat foto-foto.",
    avatar: "https://i.pravatar.cc/120?img=51",
  },
];

export default function Testimonials() {
  const [idx, setIdx] = useState(0);
  const visible = 3; // desktop
  const maxIdx = Math.max(0, TESTIMONIALS.length - visible);

  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(maxIdx, i + 1));

  return (
    <section id="testimoni" className="px-4 sm:px-6 py-16 relative z-10">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-[#F9F9F9] shadow-[4px_4px_10px_rgba(121,118,118,0.1),-4px_-4px_10px_rgba(255,255,255,1)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A373]">
            <Quote size={14} /> Social Proof
          </span>
          <h2 className="mt-4 font-montserrat text-3xl sm:text-4xl font-black text-[#1A1A1A]">
            Yang Dikatakan Pelanggan Kami
          </h2>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.slice(idx, idx + visible).map((t, i) => (
              <div
                key={i}
                className="rounded-[28px] bg-[#F9F9F9] p-6 shadow-[12px_12px_24px_rgba(121,118,118,0.1),-12px_-12px_24px_rgba(255,255,255,1)] flex flex-col"
              >
                <Quote size={28} className="text-[#D4A373]/40 mb-3" />
                <p className="text-sm font-medium text-[#797676] leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      size={14}
                      className={
                        s < t.rating ? "text-[#E9C46A] fill-[#E9C46A]" : "text-[#797676]/30"
                      }
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={44}
                    height={44}
                    sizes="44px"
                    className="h-11 w-11 rounded-full object-cover shadow-md"
                  />
                  <div>
                    <p className="text-sm font-bold text-[#1A1A1A]">{t.name}</p>
                    <p className="text-[10px] font-medium text-[#797676]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {TESTIMONIALS.length > visible && (
            <div className="mt-8 flex justify-center gap-3">
              <button
                onClick={prev}
                disabled={idx === 0}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F9F9F9] shadow-[4px_4px_10px_rgba(121,118,118,0.12),-4px_-4px_10px_rgba(255,255,255,1)] text-[#D4A373] disabled:opacity-40 transition-all active:scale-95"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                disabled={idx === maxIdx}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F9F9F9] shadow-[4px_4px_10px_rgba(121,118,118,0.12),-4px_-4px_10px_rgba(255,255,255,1)] text-[#D4A373] disabled:opacity-40 transition-all active:scale-95"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}