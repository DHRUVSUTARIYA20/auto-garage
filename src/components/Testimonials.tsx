import { Star, Quote } from "lucide-react";
import { TiltCard } from "@/components/ui/tilt-card";

const testimonials = [
  {
    name: "Michael Johnson",
    role: "Business Owner",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    content: "Best garage experience I've ever had. They fixed my transmission issue in record time and the price was exactly what they quoted. Highly recommended!",
    rating: 5,
  },
  {
    name: "Sarah Williams",
    role: "Teacher",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    content: "I was impressed by their professionalism and transparency. They showed me exactly what needed to be fixed and didn't try to upsell unnecessary services.",
    rating: 5,
  },
  {
    name: "David Chen",
    role: "Software Engineer",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    content: "The online booking system is so convenient! I scheduled my appointment in minutes and they had my car ready by end of day. Great service!",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-secondary">
      <div className="container mx-auto px-4">

        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">Testimonials</span>
          <h2 className="font-display text-4xl md:text-5xl text-secondary-foreground mt-3 mb-4">
            WHAT OUR CUSTOMERS SAY
          </h2>
          <p className="text-secondary-foreground/70">
            Don't just take our word for it. Here's what our valued customers have to say about their experience.
          </p>
        </div>


        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TiltCard key={index} className="h-full">
              <div
                className="bg-secondary-foreground/5 rounded-2xl p-8 border border-secondary-foreground/10 relative h-full"
              >
                <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/20" />

                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>

                <p className="text-gray-200 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-white">{testimonial.name}</h4>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
