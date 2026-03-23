import { CheckCircle, Users, Clock, Wallet, Shield, Headphones } from "lucide-react";
import { TiltCard } from "@/components/ui/tilt-card";

const features = [
  {
    icon: Users,
    title: "Expert Technicians",
    description: "Our certified mechanics have years of experience handling all vehicle types and brands.",
  },
  {
    icon: Clock,
    title: "Quick Turnaround",
    description: "We value your time. Most services completed within the same day.",
  },
  {
    icon: Wallet,
    title: "Transparent Pricing",
    description: "No hidden fees. Get upfront quotes before any work begins.",
  },
  {
    icon: Shield,
    title: "Quality Parts",
    description: "We use only OEM and high-quality aftermarket parts for all repairs.",
  },
  {
    icon: CheckCircle,
    title: "Warranty Included",
    description: "All our services come with a comprehensive warranty for peace of mind.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Emergency breakdown? Our support team is available round the clock.",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-24 bg-muted">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          <div>
            <span className="text-primary font-medium text-sm uppercase tracking-wider">Why Choose Us</span>
            <h2 className="font-display text-4xl md:text-5xl text-foreground mt-3 mb-6">
              THE DIFFERENCE IS IN
              <span className="text-primary block">THE DETAILS</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              We're not just another garage. We're your trusted automotive partner committed
              to delivering exceptional service with integrity and expertise.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <TiltCard key={index} className="h-full">
                  <div className="flex gap-4 p-4 rounded-xl hover:bg-card/50 transition-colors h-full">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-300">{feature.description}</p>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>


          <div className="relative">
            <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=700&fit=crop"
                alt="Auto mechanic inspecting car"
                className="w-full h-[600px] object-cover rounded-3xl"
              />

              <div className="absolute bottom-8 left-8 right-8 bg-card/95 backdrop-blur-sm p-6 rounded-2xl border border-border">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="font-display text-3xl text-primary">98%</div>
                    <div className="text-xs text-muted-foreground">Customer Satisfaction</div>
                  </div>
                  <div>
                    <div className="font-display text-3xl text-primary">15K+</div>
                    <div className="text-xs text-muted-foreground">Vehicles Serviced</div>
                  </div>
                  <div>
                    <div className="font-display text-3xl text-primary">24/7</div>
                    <div className="text-xs text-muted-foreground">Support Available</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
