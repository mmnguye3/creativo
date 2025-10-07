import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Twitter, 
  Linkedin, 
  Github, 
  Mail,
  MapPin,
  Phone
} from "lucide-react";

const Footer = () => {
  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/features", isRoute: true },
        { label: "Pricing", href: "/pricing", isRoute: true },
      ]
    },
    {
      title: "Support", 
      links: [
        { label: "Contact Us", href: "/contact", isRoute: true },
        { label: "Email Support", href: "mailto:Support@terrixcreativestud.io", isRoute: false },
        { label: "Phone Support", href: "tel:+17252247202", isRoute: false },
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about", isRoute: true },
        { label: "Contact", href: "/contact", isRoute: true },
        { label: "Resources", href: "/resources", isRoute: true },
        { label: "Privacy Policy", href: "/privacy-policy", isRoute: true },
        { label: "Terms of Service", href: "/terms-of-service", isRoute: true },
      ]
    }
  ];

  return (
    <footer className="bg-white border-t border-gray-200 text-black">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand section */}
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center">
              <img src="/lovable-uploads/98cdf8d2-6ea9-4755-8010-f50719c67e76.png" alt="Creativo" className="h-32" />
            </div>
            
            <p className="text-gray-600 max-w-md">
              The most advanced white-label design platform for agencies. 
              Launch your design business in minutes with unlimited designs and comprehensive solution.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <a href="mailto:Support@terrixcreativestud.io" className="hover:text-black transition-colors">
                  Support@terrixcreativestud.io
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <a href="tel:+17252247202" className="hover:text-black transition-colors">
                  (725) 224-7202
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>
            
          </div>

          {/* Links sections */}
          {footerSections.map((section, index) => (
            <div key={index} className="space-y-4">
              <h3 className="font-semibold text-black">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    {link.isRoute ? (
                      <Link
                        to={link.href}
                        className="text-gray-600 hover:text-black transition-colors text-sm"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a 
                        href={link.href}
                        className="text-gray-600 hover:text-black transition-colors text-sm"
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
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

        {/* CTA Section */}
        <div className="bg-gray-100 border border-gray-200 rounded-2xl p-8 mb-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl font-bold">Ready to Launch Your Agency?</h3>
            <p className="text-gray-600">
              Ready to launch your design agency? Start your journey with our powerful platform.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/contact">Get Started Today</Link>
            </Button>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-600">
            © 2024 Creativo. All rights reserved.
          </div>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <span className="text-sm text-gray-600">
              Built with ❤️ for agencies worldwide
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;