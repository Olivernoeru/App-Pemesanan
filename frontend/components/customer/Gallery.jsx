// TIER 3.1 - Gallery / Ambiance
"use client";

import Image from "next/image";
import { ImageIcon, Camera } from "lucide-react";

const GALLERY = [
  { src: "/images/gallery/suasana-01.jpg", alt: "Suasana Ilang Arah" },
  { src: "/images/gallery/suasana-02.jpg", alt: "Sudut Kedai" },
  { src: "/images/gallery/suasana-03.jpg", alt: "Area Duduk" },
  { src: "/images/gallery/suasana-04.jpg", alt: "Interior Kedai" },
  { src: "/images/gallery/suasana-05.jpg", alt: "Malam di Ilang Arah" },
  { src: "/images/gallery/suasana-6.jpg", alt: "Teman Ngopi" },
];

export default function Gallery() {
  return (
    <section id="galeri" className="px-4 sm:px-6 py-16 relative z-10">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-[#F9F9F9] shadow-[4px_4px_10px_rgba(121,118,118,0.1),-4px_-4px_10px_rgba(255,255,255,1)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A373]">
            <Camera size={14} /> Galeri
          </span>
          <h2 className="mt-4 font-montserrat text-3xl sm:text-4xl font-black text-[#1A1A1A]">
            Suasana Ilang Arah
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {GALLERY.map((g, i) => (
            <div
              key={i}
              className="group relative aspect-square overflow-hidden rounded-[24px] bg-[#F9F9F9] shadow-[12px_12px_24px_rgba(121,118,118,0.1),-12px_-12px_24px_rgba(255,255,255,1)]"
            >
              <Image
                src={g.src}
                alt={g.alt}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#F9F9F9]">
                  <ImageIcon size={14} /> {g.alt}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}