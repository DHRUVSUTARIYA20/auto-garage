
import CTASection from "@/components/CTASection";
import { Users, Award, Clock, Target, CheckCircle } from "lucide-react";
import { GlitchText } from "@/components/ui/glitch-text";
import { TiltCard } from "@/components/ui/tilt-card";

const stats = [
  { icon: Users, value: "50+", label: "Expert Mechanics" },
  { icon: Award, value: "15+", label: "Years Experience" },
  { icon: Clock, value: "10K+", label: "Happy Customers" },
  { icon: Target, value: "98%", label: "Satisfaction Rate" },
];

const team = [
  {
    name: "John Smith",
    role: "Founder & Head Mechanic",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face",
  },
  {
    name: "Sarah Johnson",
    role: "Service Manager",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face",
  },
  {
    name: "Mike Williams",
    role: "Lead Technician",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
  },
  {
    name: "Emily Chen",
    role: "Customer Relations",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face",
  },
];

const About = () => {
  return (
    <div className="min-h-screen">
      <main>

        <section className="pt-32 pb-16 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-primary font-medium text-sm uppercase tracking-wider">About Us</span>
              <h1 className="font-display text-4xl md:text-6xl text-foreground mt-3 mb-6">
                YOUR TRUSTED AUTO
                <GlitchText text="CARE PARTNER" className="text-primary block" speed={40} />
              </h1>
              <p className="text-lg text-muted-foreground">
                Since 2009, Auto Garage has been providing exceptional automotive services
                to our community. We're more than just a garage – we're your partners in
                keeping your vehicle safe and reliable.
              </p>
            </div>
          </div>
        </section>


        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                  <div className="font-display text-4xl text-secondary-foreground mb-1">{stat.value}</div>
                  <div className="text-secondary-foreground/60 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>


        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-primary font-medium text-sm uppercase tracking-wider">Our Story</span>
                <h2 className="font-display text-4xl text-foreground mt-3 mb-6">
                  BUILDING TRUST
                  <span className="text-primary block">ONE CAR AT A TIME</span>
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Auto Garage was founded in 2009 by John Smith, a passionate mechanic with
                    a vision to create a garage that prioritizes transparency, quality, and
                    customer satisfaction above all else.
                  </p>
                  <p>
                    What started as a small two-bay garage has grown into a full-service
                    automotive center with over 50 skilled technicians and state-of-the-art
                    equipment. But our core values remain the same.
                  </p>
                  <p>
                    We believe in honest communication, fair pricing, and treating every
                    customer's vehicle as if it were our own. This philosophy has earned us
                    the trust of thousands of satisfied customers over the years.
                  </p>
                </div>

                <div className="mt-8 space-y-3">
                  {["ASE Certified Technicians", "Latest Diagnostic Equipment", "Genuine OEM Parts", "Transparent Pricing"].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                      <span className="font-medium text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />
                <img
                  src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=500&fit=crop"
                  alt="Auto Garage team at work"
                  className="relative w-full h-[500px] object-cover rounded-3xl"
                />
              </div>
            </div>
          </div>
        </section>


        <section className="py-24 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-primary font-medium text-sm uppercase tracking-wider">Our Team</span>
              <h2 className="font-display text-4xl text-foreground mt-3 mb-4">
                MEET THE EXPERTS
              </h2>
              <p className="text-muted-foreground">
                Our dedicated team of professionals is committed to providing you
                with the best automotive care experience.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <TiltCard key={index} className="h-full">
                  <div className="bg-card rounded-2xl overflow-hidden border border-border h-full">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-6 text-center">
                      <h3 className="font-display text-xl text-card-foreground">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        <CTASection />
      </main>
    </div>
  );
};

export default About;
