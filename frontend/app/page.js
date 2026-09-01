"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Coffee,
  Search,
  ShoppingBag,
  Info,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  Phone,
  Minus,
  Plus,
  Trash2,
  X,
  Send,
  User,
  Hash,
  MessageSquare,
  Flame,
  Flower2,
  Leaf,
  Camera,
  CreditCard,
  Banknote,
  BadgeCheck,
  ChevronRight,
  QrCode,
  Copy,
  Check,
  SearchCheck,
} from "lucide-react";
import { API_BASE_URL, getImageUrl } from "@/lib/api";
import OperatingStatus from "@/components/customer/OperatingStatus";
import PromoBanner from "@/components/customer/PromoBanner";
import FlashDeal from "@/components/customer/FlashDeal";
import Testimonials from "@/components/customer/Testimonials";
import HowToOrder from "@/components/customer/HowToOrder";
import Gallery from "@/components/customer/Gallery";
import FAQ from "@/components/customer/FAQ";
import SiteFooter from "@/components/customer/SiteFooter";
import DrinkCustomizer from "@/components/DrinkCustomizer";

const CATEGORY_ICONS = {
  Semua: Sparkles,
  Coffee: Coffee,
  "Non Coffee": Leaf,
  "Arah Series": Flame,
  "Arah Toast": Flower2,
  Food: Coffee,
};

export default function CustomerLandingPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState([]);
  const [customizingProduct, setCustomizingProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [view, setView] = useState("cart"); // cart | checkout | success
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [orderTrackingToken, setOrderTrackingToken] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Payment Gateway Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copiedVA, setCopiedVA] = useState(false);

  // Checkout Form
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    "Semua",
    "Coffee",
    "Non Coffee",
    "Arah Series",
    "Arah Toast",
    "Food",
  ];

  const fetchActiveProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products?limit=100`);
      if (!res.ok) throw new Error("Gagal mengambil data menu");
      const json = await res.json();
      let items = [];
      if (json && Array.isArray(json.data)) items = json.data;
      else if (Array.isArray(json)) items = json;
      setProducts(
        items.filter((p) => p.is_active === 1 || p.is_active === undefined),
      );
    } catch (error) {
      console.error("Gagal menarik menu customer:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchTimer = setTimeout(() => fetchActiveProducts(), 0);
    return () => clearTimeout(fetchTimer);
  }, []);

  // ====== CART LOGIC ======
  const addToCart = (product) => {
    if (product.availability_status === "sold_out") return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          price: Number(product.price),
          quantity: 1,
          image_url: product.image_url,
        },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product_id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const resetCart = () => {
    setCart([]);
    setCustomerName("");
    setTableNumber("");
    setWhatsapp("");
    setNotes("");
    setOrderSuccess(null);
    setOrderTrackingToken(null);
    setIdempotencyKey(null);
    setIsCartOpen(false);
    setShowPaymentModal(false);
    setView("cart");
  };

  // ====== CHECKOUT LOGIC ======
  const initiateCheckout = () => {
    if (!customerName.trim()) {
      alert("Mohon isi nama Anda terlebih dahulu.");
      return;
    }
    if (cart.length === 0) {
      alert("Keranjang Anda masih kosong.");
      return;
    }

    if (paymentMethod === "qris") {
      setShowPaymentModal(true);
    } else {
      executeSubmitOrder();
    }
  };

  const executeSubmitOrder = async () => {
    setIsSubmitting(true);
    try {
      // Generate idempotency key sekali per sesi checkout (tidak berubah saat retry)
      const iKey = idempotencyKey || (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36));
      if (!idempotencyKey) setIdempotencyKey(iKey);

      // Client hanya mengirim product_id + quantity — harga dihitung server
      const payload = {
        customer_name: customerName.trim(),
        table_number: tableNumber.trim(),
        whatsapp: whatsapp.trim(),
        notes: notes.trim(),
        payment_method: paymentMethod,
        items: cart.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
      };

      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": iKey },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal membuat pesanan.");

      setOrderSuccess(json.order_id || true);
      setOrderTrackingToken(json.tracking_token || null);
      setShowPaymentModal(false);
      setView("success");
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Gagal memproses pesanan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyVA = (vaNumber) => {
    navigator.clipboard.writeText(vaNumber);
    setCopiedVA(true);
    setTimeout(() => setCopiedVA(false), 2000);
  };

  const filteredProducts = products.filter((p) => {
    const matchCategory =
      selectedCategory === "Semua" ||
      p.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchSearch =
      !searchQuery.trim() ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const fmt = (n) => "Rp " + Number(n).toLocaleString("id-ID");

  return (
    <div className="customer-theme app-surface min-h-screen bg-[#F9F9F9] font-inter text-[#1A1A1A] relative overflow-x-hidden">
      <PromoBanner />
      {/* ===== NAVBAR ===== */}
      <header className="sticky top-0 z-50 bg-[#F9F9F9]/90 backdrop-blur-xl px-4 sm:px-6 py-4 shadow-[0_8px_24px_rgba(121,118,118,0.06)]">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F9F9F9] shadow-[6px_6px_12px_rgba(121,118,118,0.15),-6px_-6px_12px_rgba(255,255,255,1)] text-[#D4A373]">
              <Coffee size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-montserrat text-base font-black tracking-widest text-[#1A1A1A]">
                ILANG ARAH
              </h1>
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#D4A373]">
                Coffee & Eatery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <a href="#katalog" className="text-xs font-bold text-[#797676] hover:text-[#D4A373] transition-colors hidden md:block">
              Katalog Menu
            </a>

            <a
              href="/cek-pesanan"
              className="flex items-center gap-2 rounded-2xl bg-[#F9F9F9] px-4 py-2.5 text-xs font-bold text-[#D4A373] shadow-[6px_6px_12px_rgba(121,118,118,0.12),-6px_-6px_12px_rgba(255,255,255,1)] hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <SearchCheck size={16} />
              <span>Lacak Pesanan</span>
            </a>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 rounded-2xl bg-[#F9F9F9] px-4 sm:px-5 py-2.5 text-xs font-bold text-[#D4A373] shadow-[6px_6px_12px_rgba(121,118,118,0.12),-6px_-6px_12px_rgba(255,255,255,1)] hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <ShoppingBag size={16} />
              <span className="hidden sm:inline">Pesanan</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D4A373] px-1.5 text-[9px] font-black text-[#F9F9F9] shadow-md">
                  {cartCount}
                </span>
              )}
            </button>

          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-14 sm:pt-20 pb-16 px-4 sm:px-6 overflow-hidden">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-[#F9F9F9] shadow-[4px_4px_10px_rgba(121,118,118,0.1),-4px_-4px_10px_rgba(255,255,255,1)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A373] mb-6">
              <Sparkles size={14} /> Menyeduh Cerita Setiap Hari
            </span>
            <h1 className="font-montserrat text-4xl sm:text-5xl lg:text-[60px] font-black text-[#1A1A1A] leading-[1.1] tracking-tight">
              Temukan Arah Rasa
              <br />
              Dalam Setiap{" "}
              <span className="text-[#D4A373]">Seduhan</span>.
            </h1>
            <p className="mt-6 text-sm sm:text-base font-medium text-[#797676] leading-relaxed max-w-xl">
              Nikmati racikan kopi terbaik, camilan lezat, dan suasana hangat di
              Ilang Arah Coffee. Semua diproses dari biji lokal dengan kualitas
              komersial & spesialti, langsung untuk Anda.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#katalog"
                className="flex items-center justify-center gap-3 rounded-2xl bg-[#F9F9F9] px-8 py-4 text-sm font-bold text-[#D4A373] shadow-[8px_8px_16px_rgba(121,118,118,0.14),-8px_-8px_16px_rgba(255,255,255,1)] transition-all hover:scale-[1.02] active:scale-95 active:shadow-[inset_6px_6px_12px_rgba(121,118,118,0.12),inset_-6px_-6px_12px_rgba(255,255,255,1)]"
              >
                <ShoppingBag size={18} /> Lihat Menu
              </a>
              <a
                href="#lokasi"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#F9F9F9] px-7 py-4 text-sm font-bold text-[#797676] shadow-[8px_8px_16px_rgba(121,118,118,0.14),-8px_-8px_16px_rgba(255,255,255,1)] transition-all hover:text-[#1A1A1A] active:scale-95 active:shadow-[inset_6px_6px_12px_rgba(121,118,118,0.12),inset_-6px_-6px_12px_rgba(255,255,255,1)]"
              >
                <MapPin size={18} /> Jam & Lokasi
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              <div className="flex items-center gap-2">
                <BadgeCheck size={16} className="text-[#D4A373]" />
                <span className="text-[11px] font-bold text-[#797676]">
                  Biji Kopi Lokal Premium
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck size={16} className="text-[#D4A373]" />
                <span className="text-[11px] font-bold text-[#797676]">
                  Disajikan Segar
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck size={16} className="text-[#D4A373]" />
                <span className="text-[11px] font-bold text-[#797676]">
                  WiFi Kencang
                </span>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center pb-10">
            <div className="relative w-full max-w-md h-[420px] rounded-[40px] bg-[#F9F9F9] p-6 shadow-[16px_16px_32px_rgba(121,118,118,0.16),-16px_-16px_32px_rgba(255,255,255,1)] flex flex-col justify-between overflow-hidden">
              <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#D4A373]/10 blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 w-48 h-48 rounded-full bg-[#D4A373]/5 blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-bold text-[#797676] uppercase tracking-[0.2em]">
                  Spesial Hari Ini
                </span>
                <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#F9F9F9] text-[#D4A373] shadow-[inset_2px_2px_4px_rgba(121,118,118,0.1),inset_-2px_-2px_4px_rgba(255,255,255,1)]">
                  Ready To Brew
                </span>
              </div>

              <div className="my-auto text-center z-10">
                <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-[#F9F9F9] shadow-[10px_10px_20px_rgba(121,118,118,0.15),-10px_-10px_20px_rgba(255,255,255,1)] text-[#D4A373]">
                  <Coffee size={56} />
                </div>
                <h3 className="font-montserrat text-2xl font-bold text-[#1A1A1A]">
                  Kopi Signature Ilang Arah
                </h3>
                <p className="text-xs text-[#797676] mt-2 max-w-xs mx-auto leading-relaxed">
                  Perpaduan espresso mantap dengan susu renyah dan gula aren
                  pilihan khas Nusantara.
                </p>
              </div>

              <div className="flex justify-between items-center z-10 pt-4 border-t border-[#797676]/10">
                <span className="text-xs font-medium text-[#797676]">Mulai</span>
                <span className="font-montserrat text-xl font-extrabold text-[#D4A373]">
                  Rp 18.000
                </span>
              </div>
            </div>

            <div className="absolute -bottom-4 left-2 sm:left-4 z-20 hidden sm:flex items-center gap-2 rounded-2xl bg-[#F9F9F9] px-4 py-3 shadow-[8px_8px_16px_rgba(121,118,118,0.14),-8px_-8px_16px_rgba(255,255,255,1)]">
              <Flame size={18} className="text-[#D4A373]" />
              <div>
                <p className="text-[11px] font-black text-[#1A1A1A]">Favorit</p>
                <p className="text-[9px] font-bold text-[#797676]">Arah Signature</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FlashDeal />
      <Gallery />

      {/* ===== KATALOG MENU SECTION ===== */}
      <section id="katalog" className="py-16 px-4 sm:px-6 relative z-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4A373]">
                Katalog Menu
              </span>
              <h2 className="font-montserrat text-3xl sm:text-4xl font-bold text-[#1A1A1A] mt-2">
                Pilih Sajian Favorit
              </h2>
              <p className="text-xs font-medium text-[#797676] mt-1">
                Data terhubung langsung dengan ketersediaan real-time di Admin.
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Cari menu favorit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl bg-[#F9F9F9] shadow-[inset_6px_6px_12px_rgba(121,118,118,0.1),inset_-6px_-6px_12px_rgba(255,255,255,1)] py-3.5 pl-5 pr-12 text-sm font-medium text-[#1A1A1A] outline-none placeholder:text-[#797676]/50 focus:shadow-[inset_4px_4px_8px_rgba(121,118,118,0.12),inset_-4px_-4px_8px_rgba(255,255,255,1)] focus:border border-transparent focus:border-[#D4A373]/20 transition-all"
              />
              <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#797676]/60" />
            </div>
          </div>

          {/* STICKY CATEGORY TABS */}
          <div className="sticky top-[64px] sm:top-[68px] z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-[#F9F9F9]/90 backdrop-blur-xl border-b border-[#797676]/10 mb-8">
            <div className="max-w-7xl mx-auto flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
              {categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat] || Sparkles;
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex shrink-0 items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#F9F9F9] text-[#D4A373] shadow-[inset_6px_6px_12px_rgba(121,118,118,0.12),inset_-6px_-6px_12px_rgba(255,255,255,1)]"
                        : "bg-[#F9F9F9] text-[#797676] shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] hover:text-[#1A1A1A]"
                    }`}
                  >
                    <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-[#797676]">
              <Loader2 size={36} className="animate-spin text-[#D4A373] mb-3" />
              <p className="text-xs font-bold">Memuat Katalog Menu...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-[#F9F9F9] shadow-[10px_10px_20px_rgba(121,118,118,0.08),-10px_-10px_20px_rgba(255,255,255,1)] rounded-[32px] p-10">
              <p className="text-sm font-bold text-[#797676]">
                Tidak ada menu yang sesuai dengan kriteria Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {filteredProducts.map((product) => {
                const isSoldOut = product.availability_status === "sold_out";
                return (
                  <div
                    key={product.id}
                    className={`group rounded-[28px] bg-[#F9F9F9] p-5 shadow-[12px_12px_24px_rgba(121,118,118,0.1),-12px_-12px_24px_rgba(255,255,255,1)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[16px_16px_32px_rgba(121,118,118,0.14),-16px_-16px_32px_rgba(255,255,255,1)] ${
                      isSoldOut ? "opacity-60" : ""
                    }`}
                  >
                    <div>
                      <div className="relative h-48 w-full rounded-2xl overflow-hidden mb-5 bg-white shadow-[inset_4px_4px_8px_rgba(121,118,118,0.1),inset_-4px_-4px_8px_rgba(230,230,230,0.5)]">
                        <Image
                          src={getImageUrl(product.image_url)}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className={`object-cover transition-transform duration-500 group-hover:scale-110 ${
                            isSoldOut ? "grayscale" : ""
                          }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#F9F9F9]/40 to-transparent pointer-events-none" />

                        <div className="absolute top-3 right-3">
                          {isSoldOut ? (
                            <span className="flex items-center gap-1 bg-red-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-md">
                              <XCircle size={12} /> Habis
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 bg-green-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-md">
                              <CheckCircle2 size={12} /> Tersedia
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-[#F9F9F9] text-[#D4A373] shadow-[inset_2px_2px_4px_rgba(121,118,118,0.08),inset_-2px_-2px_4px_rgba(255,255,255,1)]">
                          {product.category || "Coffee"}
                        </span>
                      </div>

                      <h3 className="font-montserrat text-base font-bold text-[#1A1A1A] line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs font-medium text-[#797676] mt-2 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#797676]/10 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#797676]/60">
                          Harga
                        </p>
                        <p className="font-montserrat text-base font-extrabold text-[#D4A373]">
                          {fmt(product.price)}
                        </p>
                      </div>

                      <button
                        disabled={isSoldOut}
                        onClick={() => addToCart(product)}
                        className={`p-3 rounded-xl transition-all active:scale-90 ${
                          isSoldOut
                            ? "text-[#797676]/30 cursor-not-allowed"
                            : "bg-[#F9F9F9] text-[#D4A373] shadow-[6px_6px_12px_rgba(121,118,118,0.12),-6px_-6px_12px_rgba(255,255,255,1)] hover:active:shadow-[inset_4px_4px_8px_rgba(121,118,118,0.12),inset_-4px_-4px_8px_rgba(255,255,255,1)] hover:scale-110"
                        }`}
                        title={isSoldOut ? "Menu Habis" : "Tambah ke Pesanan"}
                      >
                        <ShoppingBag size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ===== TENTANG KAMI & LOKASI ===== */}
      <section id="tentang" className="py-20 px-4 sm:px-6 relative z-10">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-[32px] bg-[#F9F9F9] p-8 shadow-[12px_12px_24px_rgba(121,118,118,0.1),-12px_-12px_24px_rgba(255,255,255,1)]">
            <h3 className="font-montserrat text-xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-3">
              <Info size={22} className="text-[#D4A373]" /> Tentang Ilang Arah
            </h3>
            <p className="text-xs text-[#797676] font-medium leading-relaxed">
              Kami percaya setiap cangkir kopi punya cerita. Di Ilang Arah
              Coffee & Eatery, kami menggunakan biji kopi lokal kualitas
              komersial & spesialti, disajikan dengan kehangatan untuk menemani
              waktu santai maupun produktivitas Anda.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-[#D4A373]" />
                <span className="text-xs font-bold text-[#1A1A1A]">100% Biji Kopi Lokal Pilihan</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-[#D4A373]" />
                <span className="text-xs font-bold text-[#1A1A1A]">Roasting Segar Setiap Minggu</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-[#D4A373]" />
                <span className="text-xs font-bold text-[#1A1A1A]">Menu Komersial & Spesialti</span>
              </div>
            </div>
          </div>

          <div id="lokasi" className="rounded-[32px] bg-[#F9F9F9] p-8 shadow-[12px_12px_24px_rgba(121,118,118,0.1),-12px_-12px_24px_rgba(255,255,255,1)]">
            <h3 className="font-montserrat text-xl font-bold text-[#1A1A1A] mb-6 flex items-center gap-3">
              <MapPin size={22} className="text-[#D4A373]" /> Informasi Kedai
            </h3>

            <div className="space-y-6 text-xs text-[#797676] font-medium">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F9F9F9] shadow-[4px_4px_8px_rgba(121,118,118,0.12),-4px_-4px_8px_rgba(255,255,255,1)] text-[#D4A373]">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="font-bold text-[#1A1A1A] text-sm uppercase tracking-wider">
                    Jam Operasional
                  </p>
                  <p className="mt-1">Senin - Minggu: 10.00 WIB - 23.00 WIB</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F9F9F9] shadow-[4px_4px_8px_rgba(121,118,118,0.12),-4px_-4px_8px_rgba(255,255,255,1)] text-[#D4A373]">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="font-bold text-[#1A1A1A] text-sm uppercase tracking-wider">
                    Alamat
                  </p>
                  <p className="mt-1">
                    Jl. Raya Utama No. 45, Kota Malang, Jawa Timur
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F9F9F9] shadow-[4px_4px_8px_rgba(121,118,118,0.12),-4px_-4px_8px_rgba(255,255,255,1)] text-[#D4A373]">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="font-bold text-[#1A1A1A] text-sm uppercase tracking-wider">
                    Kontak & Reservasi
                  </p>
                  <p className="mt-1">+62 812-3456-7890 (WhatsApp Available)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Testimonials />
      <HowToOrder />
      <FAQ />

      {/* ===== FOOTER ===== */}
      <SiteFooter />

      {/* ===== CART DRAWER ===== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="relative h-full w-full max-w-md bg-[#F9F9F9] shadow-[-8px_0_32px_rgba(121,118,118,0.2)] flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#797676]/10 flex items-center justify-between">
              <h3 className="font-montserrat text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                <ShoppingBag size={20} className="text-[#D4A373]" />
                {view === "cart" && "Pesanan Anda"}
                {view === "checkout" && "Checkout"}
                {view === "success" && "Pesanan Dibuat"}
                {cart.length > 0 && (
                  <span className="text-xs font-black text-[#797676]">
                    ({cartCount})
                  </span>
                )}
              </h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-xl bg-[#F9F9F9] shadow-[4px_4px_8px_rgba(121,118,118,0.12),-4px_-4px_8px_rgba(255,255,255,1)] text-[#797676] hover:text-[#1A1A1A] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* SUCCESS VIEW */}
            {view === "success" ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#F9F9F9] shadow-[inset_6px_6px_12px_rgba(121,118,118,0.14),inset_-6px_-6px_12px_rgba(255,255,255,1)]">
                  <CheckCircle2 size={48} className="text-[#D4A373]" />
                </div>
                <h4 className="font-montserrat text-2xl font-black text-[#1A1A1A]">
                  Berhasil! 🎉
                </h4>
                <p className="text-xs font-medium text-[#797676] mt-3 leading-relaxed max-w-xs">
                  Pesanan Anda telah diterima. Nomor pesanan:
                  <span className="font-black text-[#D4A373] block mt-1 text-base">
                    #{orderSuccess}
                  </span>
                  Simpan nomor pesanan ini untuk melacak status pesanan Anda.
                </p>
                <div className="mt-6 flex flex-col gap-3 w-full">
                  <a
                    href={`/cek-pesanan?order_id=${orderSuccess}`}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#D4A373] px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#c39262] transition-colors"
                  >
                    <SearchCheck size={16} /> Lacak Status Pesanan
                  </a>
                  <button
                    onClick={resetCart}
                    className="w-full rounded-2xl bg-[#F9F9F9] px-6 py-3.5 text-xs font-bold text-[#797676] shadow-[6px_6px_12px_rgba(121,118,118,0.12),-6px_-6px_12px_rgba(255,255,255,1)] hover:text-[#1A1A1A]"
                  >
                    Buat Pesanan Baru
                  </button>
                </div>
              </div>
            ) : view === "checkout" && cart.length > 0 ? (
              /* CHECKOUT VIEW */
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Ringkasan Ringkas */}
                <div className="rounded-2xl bg-[#F9F9F9] p-4 shadow-[inset_4px_4px_8px_rgba(121,118,118,0.1),inset_-4px_-4px_8px_rgba(255,255,255,1)]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#797676] mb-3">
                    Ringkasan Pesanan
                  </p>
                  <div className="max-h-40 overflow-y-auto pr-1 space-y-2">
                    {cart.map((item) => (
                      <div key={item.product_id} className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white shadow-[2px_2px_4px_rgba(121,118,118,0.1),-2px_-2px_4px_rgba(255,255,255,1)]">
                          <Image src={getImageUrl(item.image_url)} alt={item.product_name} fill sizes="40px" className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#1A1A1A] line-clamp-1">{item.product_name}</p>
                          <p className="text-[10px] font-medium text-[#797676]">× {item.quantity}</p>
                        </div>
                        <span className="text-xs font-bold text-[#D4A373]">{fmt(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#797676]/10">
                    <span className="text-xs font-bold text-[#797676]">Subtotal</span>
                    <span className="font-montserrat text-lg font-black text-[#D4A373]">{fmt(cartTotal)}</span>
                  </div>
                </div>

                {/* Form Data Pembeli */}
                <div className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-widest text-[#797676]">
                    Data Pembeli
                  </p>

                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#797676]/50" />
                    <input
                      type="text"
                      placeholder="Nama Anda *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-xl bg-[#F9F9F9] shadow-[inset_3px_3px_6px_rgba(121,118,118,0.1),inset_-3px_-3px_6px_rgba(255,255,255,1)] py-3 pl-11 pr-4 text-xs font-medium text-[#1A1A1A] outline-none placeholder:text-[#797676]/40 focus:border border-transparent focus:border-[#D4A373]/30 transition-all"
                    />
                  </div>

                  <div className="relative">
                    <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#797676]/50" />
                    <input
                      type="text"
                      placeholder="No Meja / Alamat"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="w-full rounded-xl bg-[#F9F9F9] shadow-[inset_3px_3px_6px_rgba(121,118,118,0.1),inset_-3px_-3px_6px_rgba(255,255,255,1)] py-3 pl-11 pr-4 text-xs font-medium text-[#1A1A1A] outline-none placeholder:text-[#797676]/40 focus:border border-transparent focus:border-[#D4A373]/30 transition-all"
                    />
                  </div>

                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#797676]/50" />
                    <input
                      type="text"
                      placeholder="No WhatsApp"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full rounded-xl bg-[#F9F9F9] shadow-[inset_3px_3px_6px_rgba(121,118,118,0.1),inset_-3px_-3px_6px_rgba(255,255,255,1)] py-3 pl-11 pr-4 text-xs font-medium text-[#1A1A1A] outline-none placeholder:text-[#797676]/40 focus:border border-transparent focus:border-[#D4A373]/30 transition-all"
                    />
                  </div>

                  <div className="relative">
                    <MessageSquare size={16} className="absolute left-4 top-4 text-[#797676]/50" />
                    <textarea
                      rows={2}
                      placeholder="Catatan pesanan (opsional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-xl bg-[#F9F9F9] shadow-[inset_3px_3px_6px_rgba(121,118,118,0.1),inset_-3px_-3px_6px_rgba(255,255,255,1)] py-3 pl-11 pr-4 text-xs font-medium text-[#1A1A1A] outline-none placeholder:text-[#797676]/40 focus:border border-transparent focus:border-[#D4A373]/30 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Metode Pembayaran */}
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#797676] mb-3">
                    Metode Pembayaran
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod("cash")}
                      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                        paymentMethod === "cash"
                          ? "bg-[#F9F9F9] text-[#D4A373] shadow-[inset_4px_4px_8px_rgba(121,118,118,0.12),inset_-4px_-4px_8px_rgba(255,255,255,1)] border border-[#D4A373]/20"
                          : "bg-[#F9F9F9] text-[#797676] shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] hover:text-[#1A1A1A]"
                      }`}
                    >
                      <Banknote size={16} /> Tunai Kasir
                    </button>
                    <button
                      onClick={() => setPaymentMethod("qris")}
                      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                        paymentMethod === "qris"
                          ? "bg-[#F9F9F9] text-[#D4A373] shadow-[inset_4px_4px_8px_rgba(121,118,118,0.12),inset_-4px_-4px_8px_rgba(255,255,255,1)] border border-[#D4A373]/20"
                          : "bg-[#F9F9F9] text-[#797676] shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] hover:text-[#1A1A1A]"
                      }`}
                    >
                      <CreditCard size={16} /> QRIS / Online
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pb-2">
                  <button
                    onClick={() => setView("cart")}
                    className="flex-1 rounded-xl bg-[#F9F9F9] shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] px-4 py-3.5 text-xs font-bold text-[#797676] transition-all hover:text-[#1A1A1A] active:shadow-[inset_3px_3px_6px_rgba(121,118,118,0.1),inset_-3px_-3px_6px_rgba(255,255,255,1)]"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={initiateCheckout}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-[#F9F9F9] px-4 py-3.5 text-xs font-bold text-[#D4A373] shadow-[8px_8px_16px_rgba(121,118,118,0.14),-8px_-8px_16px_rgba(255,255,255,1)] transition-all hover:scale-[1.02] active:scale-95 active:shadow-[inset_4px_4px_8px_rgba(121,118,118,0.12),inset_-4px_-4px_8px_rgba(255,255,255,1)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={16} /> {paymentMethod === "qris" ? "Bayar Sekarang" : "Kirim Pesanan"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* CART VIEW */
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F9F9F9] shadow-[8px_8px_16px_rgba(121,118,118,0.12),-8px_-8px_16px_rgba(255,255,255,1)] mb-5 text-[#797676]/30">
                        <ShoppingBag size={36} />
                      </div>
                      <p className="text-sm font-bold text-[#1A1A1A]">
                        Keranjang Anda masih kosong
                      </p>
                      <p className="text-xs text-[#797676] mt-1">
                        Pilih menu favorit dari katalog.
                      </p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.product_id}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-[#F9F9F9] shadow-[8px_8px_16px_rgba(121,118,118,0.1),-8px_-8px_16px_rgba(255,255,255,1)]"
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white shadow-[2px_2px_4px_rgba(121,118,118,0.1),-2px_-2px_4px_rgba(255,255,255,1)]">
                          <Image src={getImageUrl(item.image_url)} alt={item.product_name} fill sizes="56px" className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#1A1A1A] line-clamp-1">
                            {item.product_name}
                          </p>
                          <p className="text-xs font-semibold text-[#D4A373] mt-0.5">
                            {fmt(item.price)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.product_id, -1)}
                              className="p-1.5 rounded-lg bg-[#F9F9F9] shadow-[2px_2px_4px_rgba(121,118,118,0.1),-2px_-2px_4px_rgba(255,255,255,1)] text-[#797676] hover:text-[#D4A373] transition-colors active:shadow-[inset_2px_2px_4px_rgba(121,118,118,0.1),inset_-2px_-2px_4px_rgba(255,255,255,1)]"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-black text-[#1A1A1A] w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product_id, 1)}
                              className="p-1.5 rounded-lg bg-[#F9F9F9] shadow-[2px_2px_4px_rgba(121,118,118,0.1),-2px_-2px_4px_rgba(255,255,255,1)] text-[#797676] hover:text-[#D4A373] transition-colors active:shadow-[inset_2px_2px_4px_rgba(121,118,118,0.1),inset_-2px_-2px_4px_rgba(255,255,255,1)]"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <p className="text-xs font-black text-[#1A1A1A]">
                            {fmt(item.price * item.quantity)}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.product_id)}
                            className="text-[#797676]/40 hover:text-red-500 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="px-6 py-5 border-t border-[#797676]/10 space-y-4 bg-[#F9F9F9]">
                    <div className="rounded-2xl bg-[#F9F9F9] p-4 shadow-[inset_4px_4px_8px_rgba(121,118,118,0.1),inset_-4px_-4px_8px_rgba(255,255,255,1)]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#797676]">
                          Subtotal
                        </span>
                        <span className="text-sm font-bold text-[#1A1A1A]">
                          {fmt(cartTotal)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setView("checkout")}
                      className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[#F9F9F9] px-6 py-4 text-sm font-bold text-[#D4A373] shadow-[8px_8px_16px_rgba(121,118,118,0.14),-8px_-8px_16px_rgba(255,255,255,1)] transition-all hover:scale-[1.02] active:scale-95 active:shadow-[inset_4px_4px_8px_rgba(121,118,118,0.12),inset_-4px_-4px_8px_rgba(255,255,255,1)]"
                    >
                      Checkout Pesanan
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== PAYMENT GATEWAY MODAL (MIDTRANS / QRIS MOCKUP) ===== */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#1A1A1A]/60 backdrop-blur-md"
            onClick={() => !isSubmitting && setShowPaymentModal(false)}
          />

          <div className="relative w-full max-w-sm rounded-[32px] bg-[#F9F9F9] p-6 shadow-[16px_16px_32px_rgba(0,0,0,0.25)] z-10 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#797676]/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F9F9F9] shadow-[3px_3px_6px_rgba(121,118,118,0.15),-3px_-3px_6px_rgba(255,255,255,1)] text-[#D4A373]">
                  <QrCode size={18} />
                </div>
                <div>
                  <h4 className="font-montserrat text-sm font-black text-[#1A1A1A]">
                    Midtrans Payment
                  </h4>
                  <p className="text-[9px] font-bold text-[#797676] uppercase tracking-wider">
                    QRIS & Virtual Account
                  </p>
                </div>
              </div>
              <button
                disabled={isSubmitting}
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 rounded-xl bg-[#F9F9F9] shadow-[3px_3px_6px_rgba(121,118,118,0.12),-3px_-3px_6px_rgba(255,255,255,1)] text-[#797676] hover:text-[#1A1A1A]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Total Pembayaran */}
            <div className="rounded-2xl bg-[#F9F9F9] p-3.5 shadow-[inset_4px_4px_8px_rgba(121,118,118,0.1),inset_-4px_-4px_8px_rgba(255,255,255,1)] text-center mb-5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#797676]">
                Total Tagihan
              </span>
              <p className="font-montserrat text-2xl font-black text-[#D4A373] mt-0.5">
                {fmt(cartTotal)}
              </p>
            </div>

            {/* Content QRIS & VA Mockup */}
            <div className="space-y-4">
              {/* QRIS Image */}
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.06)] border border-[#797676]/10">
                <Image
                  src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=ILANG-ARAH-COFFEE-PAYMENT"
                  alt="QRIS Payment Code"
                  width={160}
                  height={160}
                  className="h-40 w-40 rounded-lg object-contain"
                />
                <span className="mt-2 text-[10px] font-bold text-[#797676] tracking-wider uppercase flex items-center gap-1">
                  <QrCode size={12} className="text-[#D4A373]" /> Scan dengan BCA, GoPay, OVO, ShopeePay
                </span>
              </div>

              {/* Virtual Account Fallback */}
              <div className="rounded-2xl bg-[#F9F9F9] p-3 shadow-[4px_4px_8px_rgba(121,118,118,0.08),-4px_-4px_8px_rgba(255,255,255,1)]">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#797676] mb-1">
                  Atau Virtual Account (BCA/Mandiri)
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-[#1A1A1A] tracking-wider">
                    8801 2938 4819 02
                  </span>
                  <button
                    onClick={() => handleCopyVA("88012938481902")}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#D4A373] hover:underline"
                  >
                    {copiedVA ? (
                      <>
                        <Check size={12} /> Tersalin
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Salin
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6 space-y-2">
              <button
                onClick={() => executeSubmitOrder("Paid")}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#D4A373] py-3.5 text-xs font-bold text-white shadow-[4px_4px_12px_rgba(212,163,115,0.4)] hover:bg-[#c39262] transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Saya Sudah Bayar (Konfirmasi)
                  </>
                )}
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isSubmitting}
                className="w-full py-2 text-[11px] font-bold text-[#797676] hover:text-[#1A1A1A] transition-colors"
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
