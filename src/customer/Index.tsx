import Hero from "@/components/Hero";
import Services from "@/components/Services";
import CarBrandCarousel from "@/components/CarBrandCarousel";
import WhyChooseUs from "@/components/WhyChooseUs";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";

import FAQ from "@/components/FAQ";

const Index = () => {
  console.log("✅ Home page (Index) rendering - all components loading");
  
  return (
    <div className="min-h-screen">
      <Hero />
      <Services />
      <CarBrandCarousel />
      <WhyChooseUs />
      <Testimonials />
      <FAQ />
      <CTASection />
    </div>
  );
};

export default Index;
