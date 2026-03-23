import { Link } from "react-router-dom";
import { Wrench, Phone, Mail, MapPin, Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          <div>
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Wrench className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display text-2xl tracking-wide">AUTO GARAGE</h2>
                <p className="text-xs text-secondary-foreground/70 -mt-1">Professional Car Care</p>
              </div>
            </Link>
            <p className="text-secondary-foreground/70 text-sm leading-relaxed">
              Your trusted partner for all automotive needs. Quality service, expert mechanics, and customer satisfaction guaranteed.
            </p>
          </div>


          <div>
            <h3 className="font-display text-xl tracking-wide mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {["Home", "Services", "Book Service", "About", "Contact"].map((item) => (
                <li key={item}>
                  <Link
                    to={item === "Home" ? "/" : item === "Book Service" ? "/booking" : `/${item.toLowerCase()}`}
                    className="text-secondary-foreground/70 text-sm hover:text-primary transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>


          <div>
            <h3 className="font-display text-xl tracking-wide mb-6">Our Services</h3>
            <ul className="space-y-3">
              {["Oil Change", "Engine Repair", "Brake Service", "Car Wash", "AC Service", "Tire Change"].map((service) => (
                <li key={service}>
                  <span className="text-secondary-foreground/70 text-sm">{service}</span>
                </li>
              ))}
            </ul>
          </div>


          <div>
            <h3 className="font-display text-xl tracking-wide mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-secondary-foreground/70 text-sm">
                  123 Garage Street, Auto City, AC 12345
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <a href="tel:+1234567890" className="text-secondary-foreground/70 text-sm hover:text-primary transition-colors">
                  (123) 456-7890
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <a href="mailto:info@autogarage.com" className="text-secondary-foreground/70 text-sm hover:text-primary transition-colors">
                  info@autogarage.com
                </a>
              </li>
            </ul>


            <div className="flex gap-4 mt-6">
              {[Facebook, Instagram, Twitter].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 bg-secondary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary transition-colors group"
                >
                  <Icon className="w-5 h-5 text-secondary-foreground/70 group-hover:text-primary-foreground" />
                </a>
              ))}
            </div>
          </div>
        </div>


        <div className="border-t border-secondary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-secondary-foreground/50 text-sm">
            © 2024 Auto Garage. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-secondary-foreground/50 text-sm hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-secondary-foreground/50 text-sm hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
