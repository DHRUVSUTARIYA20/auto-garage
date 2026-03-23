import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import DotPattern from "./components/ui/dot-pattern";
import { MainLayout } from "./components/MainLayout";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { GlobalShortcuts } from "./components/GlobalShortcuts";
import { RouteChangeProgress } from "./components/RouteChangeProgress";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import GuestRoute from "./components/auth/GuestRoute";
import Index from "./customer/Index";

// Lazy load pages

// Admin Pages
const Admin = lazy(() => import("./admin/Admin"));

// Mechanic/Staff Pages
const MechanicDashboard = lazy(() => import("./mechanic/MechanicDashboard"));
const StaffDashboard = lazy(() => import("./mechanic/StaffDashboard"));
const AddStaff = lazy(() => import("./mechanic/AddStaff"));

// Garage Pages
const GarageHost = lazy(() => import("./garage/GarageHost"));
const GarageListing = lazy(() => import("./garage/GarageListing"));
const GarageDetail = lazy(() => import("./garage/GarageDetail"));
const AddGarage = lazy(() => import("./garage/AddGarage"));

// Customer Pages
const About = lazy(() => import("./customer/About"));
const Booking = lazy(() => import("./customer/Booking"));
const Contact = lazy(() => import("./customer/Contact"));
const Register = lazy(() => import("./customer/Register"));
const ServicesPage = lazy(() => import("./customer/ServicesPage"));
const Dashboard = lazy(() => import("./customer/Dashboard"));
const Pricing = lazy(() => import("./customer/Pricing"));
const Track = lazy(() => import("./customer/Tracking"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./customer/ForgotPassword"));
const ResetPassword = lazy(() => import("./customer/ResetPassword"));

// Shared Pages
const NotFound = lazy(() => import("./pages/NotFound"));

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

// Background layer - removed 3D car component
const BackgroundLayer = () => {
  const { pathname } = useLocation();

  const noCanvasBackground =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/customer") ||
    pathname.startsWith("/garage") ||
    pathname.startsWith("/mechanic") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  return <div className="fixed inset-0 bg-background z-[-1]" />;
};

export default function App() {
  return (
    <ErrorBoundary>
      {/* White Dot Pattern */}
      <DotPattern
        className="fixed inset-0 z-[1] pointer-events-none opacity-20 text-white fill-white"
        width={24}
        height={24}
        cx={1.5}
        cy={1.5}
        cr={1.5}
      />

      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <BackgroundLayer />
        <AuthProvider>
          <div className="relative z-10">
            <RouteChangeProgress />
            <GlobalShortcuts />
            <Navbar />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public layout routes */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/garages" element={<GarageListing />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/track" element={<Track />} />
                  <Route path="/garage/:id" element={<GarageDetail />} />

                  {/* Protected public routes - any logged-in user */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/booking" element={<Booking />} />
                    <Route path="/garage/add" element={<AddGarage />} />
                    <Route path="/garage/staff/add" element={<AddStaff />} />
                  </Route>
                </Route>

                {/* Guest-only routes (login/register/password recovery - blocked if already logged in) */}
                <Route element={<GuestRoute />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Navigate to="/customer/register" replace />} />
                  <Route path="/customer/login" element={<Navigate to="/login" replace />} />
                  <Route path="/customer/register" element={<Register />} />
                  <Route path="/admin/login" element={<Navigate to="/login" replace />} />
                  <Route path="/garage/login" element={<Navigate to="/login" replace />} />
                  <Route path="/mechanic/login" element={<Navigate to="/login" replace />} />
                  <Route path="/customer/forgot-password" element={<ForgotPassword />} />
                </Route>

                {/* Password reset (no auth guard - can access with token) */}
                <Route path="/customer/reset-password" element={<ResetPassword />} />

                {/* Protected: Admin only */}
                <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                  <Route path="/admin/dashboard" element={<Admin />} />
                </Route>

                {/* Protected: Garage Manager only */}
                <Route element={<ProtectedRoute allowedRoles={["manager"]} />}>
                  <Route path="/garage/dashboard" element={<GarageHost />} />
                </Route>

                {/* Protected: Mechanic/Staff only */}
                <Route element={<ProtectedRoute allowedRoles={["staff", "mechanic"]} />}>
                  <Route path="/mechanic/dashboard" element={<StaffDashboard />} />
                  <Route path="/mechanic/staff" element={<StaffDashboard />} />
                </Route>

                {/* Protected: Customer only */}
                <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
                  <Route path="/customer/dashboard" element={<Dashboard />} />
                </Route>

                {/* Catch-all 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
