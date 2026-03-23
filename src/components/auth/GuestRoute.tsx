import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import { Loader2 } from "lucide-react";

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <div className="flex items-center justify-center">
      <div className="relative">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
      </div>
    </div>
  </div>
);

const getDashboardUrl = (role?: string): string => {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "admin") return "/admin/dashboard";
  if (normalized === "manager") return "/garage/dashboard";
  if (normalized === "staff" || normalized === "mechanic") return "/mechanic/dashboard";
  return "/customer/dashboard";
};

export default function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  // Already logged in → send to their own dashboard
  if (user) {
    return <Navigate to={getDashboardUrl(user.role)} replace />;
  }

  return <Outlet />;
}
