import AdminRouteGuard from "@/components/AdminRouteGuard";

export default function PosLayout({ children }) {
  return <AdminRouteGuard>{children}</AdminRouteGuard>;
}
