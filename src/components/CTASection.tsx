import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, LogIn } from "lucide-react";
import { useAuth } from "../context/useAuth";

const CTASection = () => {
  const { user } = useAuth();
  const isLoggedIn = user !== null && user !== undefined;
  const rawRole = user?.role;
  const userRole = typeof rawRole === "string" ? rawRole : "customer";

  const getDashboardUrl = (role: string) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "manager") return "/garage/dashboard";
    if (role === "staff" || role === "mechanic") return "/mechanic/dashboard";
    return "/customer/dashboard";
  };

  return (
    <section className="py-12 md:py-24 bg-gradient-to-b from-card to-background relative overflow-hidden">

      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-6xl text-white mb-6">
            FIND YOUR PERFECT GARAGE
            <span className="block text-primary">AND BOOK YOUR SERVICE</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Browse our trusted garages, compare services, and book your appointment today.
            Select delivery or pickup options for convenience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8 bg-primary text-primary-foreground hover:bg-primary/90"
              asChild
            >
              <Link to="/garages">
                <ArrowRight className="mr-2 w-5 h-5" />
                Find a Garage
              </Link>
            </Button>
            {isLoggedIn ? (
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 border-white/20 text-white hover:bg-white/10"
                asChild
              >
                <Link to={getDashboardUrl(userRole)}>
                  <LogIn className="mr-2 w-5 h-5" />
                  My Dashboard
                </Link>
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 border-white/20 text-white hover:bg-white/10"
                asChild
              >
                <Link to="/register">
                  <LogIn className="mr-2 w-5 h-5" />
                  Register
                </Link>
              </Button>
            )}
          </div>


          <div className="flex flex-wrap justify-center gap-8 mt-12 pt-12 border-t border-white/10">
            {["Free Estimates", "Same Day Service", "Certified Mechanics", "Warranty Included"].map((badge, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-400">
                <ArrowRight className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
