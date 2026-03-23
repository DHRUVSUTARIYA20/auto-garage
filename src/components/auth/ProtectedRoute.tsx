import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

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

export default function ProtectedRoute({ allowedRoles = [] }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  // Not logged in → redirect to correct login page based on URL
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to their own dashboard
  const userRole = String(user.role || "").toLowerCase();
  const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

  if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(userRole)) {
    return <Navigate to={getDashboardUrl(userRole)} replace />;
  }

  return <Outlet />;
}
