"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function AdminRouteGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") return undefined;

    let isActive = true;

    const verifyAdminSession = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/admin/login");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok || !data.success || data.user?.role !== "admin") {
          localStorage.removeItem("token");
          router.replace("/admin/login");
          return;
        }

        if (isActive) setIsAuthorized(true);
      } catch {
        localStorage.removeItem("token");
        router.replace("/admin/login");
      }
    };

    verifyAdminSession();
    return () => {
      isActive = false;
    };
  }, [pathname, router]);

  if (pathname === "/admin/login") return children;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D4A373]" size={40} aria-label="Memeriksa akses" />
      </div>
    );
  }

  return children;
}
