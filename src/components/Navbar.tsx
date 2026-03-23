import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Wrench } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { Button } from "@/components/ui/button";

interface NavLink {
  name: string;
  path: string;
}

const Navbar = (): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const role = String(user?.role || "guest").toLowerCase();
  const path = location.pathname;

  // Hide navbar for all role-specific dashboard areas, even before auth state is hydrated.
  const isRoleAreaRoute =
    path.startsWith("/admin") ||
    path.startsWith("/garage") ||
    path.startsWith("/mechanic") ||
    path.startsWith("/staff");

  const shouldHideNavbar = isRoleAreaRoute;

  const guestLinks: NavLink[] = [
    { name: "Home", path: "/" },
    { name: "Garages", path: "/garages" },
    { name: "Services", path: "/services" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const customerLinks: NavLink[] = [
    { name: "Home", path: "/" },
    { name: "Book", path: "/booking" },
    { name: "Track", path: "/track" },
    { name: "Garages", path: "/garages" },
    { name: "Dashboard", path: "/customer/dashboard" },
  ];

  const staffLinks: NavLink[] = [
    { name: "Dashboard", path: "/mechanic/dashboard" },
    { name: "Track", path: "/track" },
  ];

  const managerLinks: NavLink[] = [
    { name: "Dashboard", path: "/garage/dashboard" },
    { name: "Add Garage", path: "/garage/add" },
    { name: "Add Staff", path: "/garage/staff/add" },
  ];

  const adminLinks: NavLink[] = [
    { name: "Dashboard", path: "/admin/dashboard" },
  ];

  const navLinks: NavLink[] =
    role === "admin"
      ? adminLinks
      : role === "manager"
        ? managerLinks
        : role === "staff" || role === "mechanic"
          ? staffLinks
          : user
            ? customerLinks
            : guestLinks;

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/admin/login" ||
    location.pathname === "/staff/login" ||
    location.pathname === "/garage/login";

  const isActive = (path: string): boolean =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (shouldHideNavbar) {
    return <></>;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/75 backdrop-blur-xl border-b border-border/70">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-foreground">AUTO GARAGE</h1>
              <p className="text-[10px] text-muted-foreground -mt-1 font-medium">Professional Car Care</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${isActive(link.path) ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="flex items-center gap-3">
              {user ? (
                <Button size="sm" variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              ) : !isAuthPage ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/register">Register</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <button
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block py-3 text-sm font-medium transition-colors hover:text-primary ${isActive(link.path) ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                {link.name}
              </Link>
            ))}

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full text-left py-3 text-sm font-medium text-muted-foreground hover:text-primary"
              >
                Logout
              </button>
            ) : !isAuthPage ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block py-3 text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block py-3 text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Register
                </Link>
              </>
            ) : null}
          </div>
        )}
      </div>
    </nav>
  );
};

export { Navbar };
export default Navbar;
