"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Info, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, API_ENDPOINTS, authFetch } from "@/lib/api";

export default function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Fungsi Narik Data dari Backend
  const fetchNotifications = async () => {
    try {
      const res = await authFetch(API_ENDPOINTS.NOTIFICATIONS);
      const data = await res.json();
      if (data.success) setNotifications(data.data);

      const resCount = await authFetch(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT);
      const dataCount = await resCount.json();
      if (dataCount.success) setUnreadCount(dataCount.count);
    } catch (error) {
      console.error("Gagal menarik notifikasi", error);
    }
  };

  // 1. Tarik data saat pertama loading
  // 2. Set interval polling setiap 15 detik (Auto-refresh)
  useEffect(() => {
    const timer = setTimeout(() => fetchNotifications(), 0);
    const interval = setInterval(fetchNotifications, 15000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Menutup dropdown kalau klik di luar kotak
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Aksi pas satu notifikasi diklik
  const handleReadSingle = async (id, orderId) => {
    try {
      await authFetch(API_ENDPOINTS.NOTIFICATION_READ(id), { method: "PATCH" });
      fetchNotifications();
      setIsOpen(false);
      
      // Jika tipe notifnya pesanan, arahkan ke detail (Nanti fiturnya jalan pas halaman order jadi)
      if (orderId) {
        alert(`Nanti akan dialihkan ke pesanan ID: ${orderId}`);
        // router.push(`/admin/orders/${orderId}`); 
      }
    } catch (error) {
      console.error("Gagal update notif", error);
    }
  };

  // Aksi tombol "Tandai Semua Dibaca"
  const handleReadAll = async () => {
    try {
      await authFetch(API_ENDPOINTS.NOTIFICATIONS_READ_ALL, { method: "PATCH" });
      fetchNotifications();
    } catch (error) {
      console.error("Gagal read all", error);
    }
  };

  // Format jam biar estetik (contoh: 22:15)
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Lonceng Neumorphism */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F9F9F9] shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] text-[#797676] hover:text-[#D4A373] transition-all active:shadow-[inset_4px_4px_8px_rgba(121,118,118,0.1),inset_-4px_-4px_8px_rgba(255,255,255,1)]"
      >
        <Bell size={20} />
        
        {/* Red Dot & Efek Ping kalau ada pesan baru */}
        {unreadCount > 0 && (
          <span className="absolute right-3 top-3 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          </span>
        )}
      </button>

      {/* Pop-over Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-4 w-[350px] rounded-[24px] bg-[#F9F9F9] shadow-[12px_12px_24px_rgba(121,118,118,0.15),-12px_-12px_24px_rgba(255,255,255,1)] border border-white/60 z-50 overflow-hidden flex flex-col max-h-[450px]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#797676]/10">
            <div>
              <h3 className="font-montserrat text-base font-bold text-[#1A1A1A]">Notifikasi</h3>
              <p className="text-[10px] font-medium text-[#D4A373] mt-0.5">{unreadCount} belum dibaca</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleReadAll}
                className="p-2.5 text-[#797676] hover:text-[#D4A373] transition-colors rounded-xl shadow-[2px_2px_5px_rgba(121,118,118,0.08),-2px_-2px_5px_rgba(255,255,255,1)] hover:shadow-[inset_2px_2px_4px_rgba(121,118,118,0.1),inset_-2px_-2px_4px_rgba(255,255,255,1)]"
                title="Tandai semua dibaca"
              >
                <Check size={16} />
              </button>
            )}
          </div>

          {/* List Pesan */}
          <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-[#797676] text-xs font-medium">Belum ada notifikasi aktivitas.</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleReadSingle(notif.id, notif.order_id)}
                  className={`cursor-pointer flex gap-4 p-4 rounded-2xl transition-all mb-3 last:mb-0 ${
                    notif.is_read === 0
                      ? "bg-[#F9F9F9] shadow-[inset_3px_3px_6px_rgba(121,118,118,0.08),inset_-3px_-3px_6px_rgba(255,255,255,1)]"
                      : "hover:bg-[#F9F9F9]/50 hover:shadow-[inset_2px_2px_4px_rgba(121,118,118,0.05),inset_-2px_-2px_4px_rgba(255,255,255,1)]"
                  }`}
                >
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-[2px_2px_6px_rgba(121,118,118,0.08),-2px_-2px_6px_rgba(255,255,255,1)] ${notif.is_read === 0 ? "bg-[#F9F9F9] text-[#D4A373]" : "bg-[#F9F9F9] text-[#797676]"}`}>
                    {notif.type === 'new_order' ? <ShoppingBag size={16} /> : <Info size={16} />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs ${notif.is_read === 0 ? "font-bold text-[#1A1A1A]" : "font-medium text-[#797676]"}`}>{notif.title}</p>
                      <span className="text-[9px] font-bold text-[#797676] shrink-0 mt-0.5 bg-[#F9F9F9] px-2 py-1 rounded-md shadow-[inset_1px_1px_3px_rgba(121,118,118,0.1)]">{formatTime(notif.created_at)}</span>
                    </div>
                    <p className={`text-[10px] mt-1.5 leading-relaxed line-clamp-2 ${notif.is_read === 0 ? "font-medium text-[#797676]" : "font-normal text-[#797676]/70"}`}>
                      {notif.message}
                    </p>
                  </div>

                  {notif.is_read === 0 && (
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 mt-1 shrink-0 shadow-[0_0_4px_rgba(239,68,68,0.4)]"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}