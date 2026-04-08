import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Services", href: "/services", isRoute: true },
      { label: "Features", href: "/features", isRoute: true },
      { label: "Pricing", href: "/pricing", isRoute: true },
      { label: "Resources", href: "/resources", isRoute: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about", isRoute: true },
      { label: "Contact", href: "/contact", isRoute: true },
      { label: "Privacy Policy", href: "/privacy-policy", isRoute: true },
      { label: "Terms of Service", href: "/terms-of-service", isRoute: true },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact Us", href: "/contact", isRoute: true },
      { label: "Email Support", href: "mailto:support@cretivo.io", isRoute: false },
      { label: "Phone Support", href: "tel:+17252247202", isRoute: false },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="bg-zinc-950 border-t border-white/5">
      {/* CTA Banner */}
      <div className="border-b border-white/5">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Ready to launch your agency?</h3>
              <p className="text-zinc-500 text-sm">Start building your design business with Cretivo today.</p>
            </div>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/20 shrink-0 group"
              size="lg"
              asChild
            >
              <Link to="/contact">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/">
              <img src="/cretivo-logo.png" alt="Cretivo" className="h-8 w-auto" />
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
              The most advanced white-label design platform for agencies.
              Launch your design business in minutes with unlimited designs.
            </p>
            <div className="space-y-2 pt-1">
              <a href="mailto:support@cretivo.io" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                <Mail className="w-3.5 h-3.5 text-zinc-600" />
                support@cretivo.io
              </a>
              <a href="tel:+17252247202" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                <Phone className="w-3.5 h-3.5 text-zinc-600" />
                (725) 224-7202
              </a>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                Dover, DE 19904
              </div>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.isRoute ? (
                      <Link
                        to={link.href}
                        className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
                        target={link.href.startsWith("http") ? "_blank" : undefined}
                        rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} Cretivo. All rights reserved.</p>
          <p className="text-xs text-zinc-700">Built for agencies worldwide</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
