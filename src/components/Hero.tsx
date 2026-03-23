import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Clock, Award, Wrench, Users, CheckCircle } from "lucide-react";

const Hero = () => {
  const stats = [
    { icon: Shield, label: "Certified", value: "50+" },
    { icon: Clock, label: "Experience", value: "15+ yrs" },
    { icon: Award, label: "Customers", value: "10K+" },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center bg-background overflow-hidden pt-16">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-6 border border-primary/10">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Trusted Since 2009</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-6 tracking-tight">
              Expert Care for <br />
              <span className="text-primary italic">Every Premium Car.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
              Certified technicians, transparent pricing, and exceptional service.
              Book your appointment today at your nearest garage.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="rounded-xl h-14 px-8 text-md font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95" asChild>
                <Link to="/garages">
                  Explore Garages
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl h-14 px-8 text-md font-bold hover:bg-muted active:scale-95" asChild>
                <Link to="/track">Track Booking</Link>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-border/50">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block animate-fade-in-delayed">
            <div className="w-full h-[500px] relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border border-border/50 flex items-center justify-center">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                  <Wrench className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Professional Auto Care</h3>
                <div className="space-y-3 w-full max-w-xs">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm text-muted-foreground">Expert technicians</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm text-muted-foreground">Quality parts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm text-muted-foreground">Transparent pricing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm text-muted-foreground">Warranty included</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 bg-background p-6 rounded-2xl shadow-xl border border-border max-w-[200px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <p className="font-bold text-sm leading-tight">100% Quality Guaranteed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
