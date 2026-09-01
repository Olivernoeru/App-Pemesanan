"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Coffee,
  Search,
  SearchCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  ShoppingBag,
  User,
  Hash,
  Calendar,
  CreditCard,
  Banknote,
  UtensilsCrossed,
  Sparkles,
} from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("order_id") || "";

  const [query, setQuery] = useState(initialOrderId);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setErrorMsg("");
    setOrder(null);
    setHasSearched(true);

    try {
      // ID numerik dikirim sebagai order_id; input lain dicari sebagai nomor WhatsApp.
      const trimmed = query.trim();
      const isNumeric = /^\d+$/.test(trimmed);
      const params = new URLSearchParams();
      if (isNumeric) {
        params.set("order_id", trimmed);
      } else {
        params.set("whatsapp", trimmed);
      }

      const res = await fetch(`${API_ENDPOINTS.ORDER_TRACK}?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Pesanan tidak ditemukan.");
      }

      setOrder(json.data);
    } catch (err) {
      console.error("Error tracking order:", err);
      setErrorMsg(err.message || "Gagal melacak pesanan.");
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (initialOrderId) {
      const timer = setTimeout(() => handleSearch(), 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [handleSearch, initialOrderId]);

  const fmt = (n) => "Rp " + Number(n).toLocaleString("id-ID");

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "menunggu":
        return {
          label: "Menunggu Konfirmasi",
          color: "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20",
          icon: Clock,
        };
      case "processing":
      case "diproses":
        return {
          label: "Sedang Diproses",
          color: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
          icon: UtensilsCrossed,
        };
      case "completed":
      case "selesai":
        return {
          label: "Pesanan Selesai",
          color: "bg-green-500/10 text-green-600 border border-green-500/20",
          icon: CheckCircle2,
        };
      case "cancelled":
      case "dibatalkan":
        return {
          label: "Pesanan Dibatalkan",
          color: "bg-red-500/10 text-red-600 border border-red-500/20",
          icon: XCircle,
        };
      default:
        return {
          label: status || "Diproses",
          color: "bg-gray-500/10 text-gray-600 border border-gray-500/20",
          icon: Clock,
        };
    }
  };

  const steps = ["Menunggu", "Diproses", "Selesai"];
  const normalizedStatus = order?.status?.toLowerCase();
  const currentStepIndex = order
    ? ["cancelled", "dibatalkan"].includes(normalizedStatus)
      ? -1
      : steps.findIndex((s) => s.toLowerCase() === normalizedStatus)
    : 0;

  return (
    <div className="customer-theme min-h-screen bg-[#F9F9F9] font-inter text-[#1A1A1A] py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        {/* Header Nav */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-2xl bg-[#F9F9F9] px-4 py-2.5 text-xs font-bold text-[#797676] shadow-[6px_6px_12px_rgba(121,118,118,0.12),-6px_-6px_12px_rgba(255,255,255,1)] hover:text-[#1A1A1A] transition-all"
          >
            <ArrowLeft size={16} /> Kembali ke Kedai
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F9F9F9] shadow-[4px_4px_8px_rgba(121,118,118,0.12),-4px_-4px_8px_rgba(255,255,255,1)] text-[#D4A373]">
              <Coffee size={18} />
            </div>
            <span className="font-montserrat text-xs font-black tracking-widest text-[#1A1A1A]">
              ILANG ARAH
            </span>
          </div>
        </div>

        {/* Title Box */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-[#F9F9F9] shadow-[4px_4px_10px_rgba(121,118,118,0.1),-4px_-4px_10px_rgba(255,255,255,1)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A373] mb-4">
            <SearchCheck size={14} /> Tracking Pesanan
          </span>
          <h1 className="font-montserrat text-3xl sm:text-4xl font-extrabold text-[#1A1A1A]">
            Lacak Pesanan Anda
          </h1>
          <p className="text-xs text-[#797676] font-medium mt-2 max-w-md mx-auto">
            Masukkan Nomor Pesanan (ID Pesanan) atau Nomor WhatsApp yang Anda
            gunakan saat checkout.
          </p>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleSearch}
          className="mb-10 rounded-[28px] bg-[#F9F9F9] p-4 sm:p-6 shadow-[12px_12px_24px_rgba(121,118,118,0.12),-12px_-12px_24px_rgba(255,255,255,1)] flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#797676]/50"
            />
            <input
              type="text"
              placeholder="Masukkan ID Pesanan (misal: 6) atau No WA..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl bg-[#F9F9F9] shadow-[inset_4px_4px_8px_rgba(121,118,118,0.1),inset_-4px_-4px_8px_rgba(255,255,255,1)] py-3.5 pl-11 pr-4 text-xs font-bold text-[#1A1A1A] outline-none placeholder:text-[#797676]/40 focus:border border-transparent focus:border-[#D4A373]/30 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#D4A373] px-8 py-3.5 text-xs font-bold text-white shadow-[6px_6px_16px_rgba(212,163,115,0.4)] hover:bg-[#c39262] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Search size={16} /> Cari Pesanan
              </>
            )}
          </button>
        </form>

        {/* Result Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#797676]">
            <Loader2 size={36} className="animate-spin text-[#D4A373] mb-3" />
            <p className="text-xs font-bold">Mencari data pesanan...</p>
          </div>
        ) : errorMsg ? (
          <div className="rounded-[28px] bg-[#F9F9F9] p-8 text-center shadow-[10px_10px_20px_rgba(121,118,118,0.08),-10px_-10px_20px_rgba(255,255,255,1)]">
            <XCircle size={40} className="mx-auto text-red-500 mb-3" />
            <h3 className="font-montserrat text-lg font-bold text-[#1A1A1A]">
              Pesanan Tidak Ditemukan
            </h3>
            <p className="text-xs text-[#797676] mt-1">{errorMsg}</p>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Status Card & Progress */}
            <div className="rounded-[32px] bg-[#F9F9F9] p-6 sm:p-8 shadow-[12px_12px_24px_rgba(121,118,118,0.12),-12px_-12px_24px_rgba(255,255,255,1)]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#797676]/10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#797676]">
                    ID Pesanan
                  </span>
                  <h2 className="font-montserrat text-2xl font-black text-[#D4A373]">
                    #{order.id}
                  </h2>
                </div>

                {(() => {
                  const badge = getStatusBadge(order.status);
                  const Icon = badge.icon;
                  return (
                    <span
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold ${badge.color}`}
                    >
                      <Icon size={16} />
                      {badge.label}
                    </span>
                  );
                })()}
              </div>

              {/* Status Timeline */}
              {!(["cancelled", "dibatalkan"].includes(normalizedStatus)) && (
                <div className="py-8">
                  <div className="relative flex items-center justify-between">
                    {/* Line Background */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 bg-[#797676]/10 rounded-full z-0" />
                    {/* Active Line Progress */}
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-[#D4A373] rounded-full z-0 transition-all duration-500"
                      style={{
                        width: `${
                          currentStepIndex === 0
                            ? 0
                            : currentStepIndex === 1
                            ? 50
                            : 100
                        }%`,
                      }}
                    />

                    {/* Steps */}
                    {steps.map((step, idx) => {
                      const isDone = idx <= currentStepIndex;
                      return (
                        <div
                          key={step}
                          className="relative z-10 flex flex-col items-center"
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-all ${
                              isDone
                                ? "bg-[#D4A373] text-white shadow-[0_4px_12px_rgba(212,163,115,0.4)]"
                                : "bg-[#F9F9F9] text-[#797676] shadow-[4px_4px_8px_rgba(121,118,118,0.12),-4px_-4px_8px_rgba(255,255,255,1)]"
                            }`}
                          >
                            {isDone ? <CheckCircle2 size={18} /> : idx + 1}
                          </div>
                          <span
                            className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${
                              isDone ? "text-[#D4A373]" : "text-[#797676]/60"
                            }`}
                          >
                            {step === "Menunggu"
                              ? "Menunggu"
                              : step === "Diproses"
                              ? "Diproses"
                              : "Selesai"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Customer & Order Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#797676]/10 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#797676]/60 uppercase tracking-widest block">
                    Pelanggan
                  </span>
                  <span className="font-bold text-[#1A1A1A] mt-0.5 block">
                    {order.customer_name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#797676]/60 uppercase tracking-widest block">
                    No Meja
                  </span>
                  <span className="font-bold text-[#1A1A1A] mt-0.5 block">
                    {order.table_number || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#797676]/60 uppercase tracking-widest block">
                    Pembayaran
                  </span>
                  <span className="font-bold text-[#D4A373] uppercase mt-0.5 block">
                    {order.payment_method} ({order.payment_status || "Paid"})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#797676]/60 uppercase tracking-widest block">
                    Waktu Pesan
                  </span>
                  <span className="font-bold text-[#1A1A1A] mt-0.5 block">
                    {new Date(order.created_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    WIB
                  </span>
                </div>
              </div>
            </div>

            {/* Item Details */}
            <div className="rounded-[32px] bg-[#F9F9F9] p-6 sm:p-8 shadow-[12px_12px_24px_rgba(121,118,118,0.12),-12px_-12px_24px_rgba(255,255,255,1)]">
              <h3 className="font-montserrat text-sm font-bold uppercase tracking-widest text-[#1A1A1A] mb-4">
                Detail Menu Dipesan
              </h3>

              <div className="divide-y divide-[#797676]/10">
                {order.items &&
                  order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="py-3 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F9F9F9] shadow-[inset_2px_2px_4px_rgba(121,118,118,0.1),inset_-2px_-2px_4px_rgba(255,255,255,1)] font-black text-[#D4A373]">
                          {item.quantity}x
                        </span>
                        <span className="font-bold text-[#1A1A1A]">
                          {item.product_name || `Produk #${item.product_id}`}
                        </span>
                      </div>
                      <span className="font-bold text-[#D4A373]">
                        {fmt(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#797676]/10">
                <span className="text-xs font-bold text-[#797676]">
                  Total Pembayaran
                </span>
                <span className="font-montserrat text-xl font-extrabold text-[#D4A373]">
                  {fmt(order.total_price)}
                </span>
              </div>
            </div>
          </div>
        ) : hasSearched ? null : (
          <div className="text-center py-12 text-[#797676] text-xs font-medium">
            Silakan masukkan ID pesanan Anda pada kolom di atas.
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center text-xs font-bold text-[#797676]">
          <Loader2 size={24} className="animate-spin text-[#D4A373] mr-2" />
          Memuat halaman lacak pesanan...
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
