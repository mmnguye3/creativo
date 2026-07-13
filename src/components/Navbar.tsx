import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Settings, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";

const navLinks = [
  { label: "Services", href: "/services" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || isOpen
          ? "bg-zinc-950/95 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      {/* Scroll progress line */}
      <div
        className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-75 rounded-r-full"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/cretivo-logo.png" alt="Cretivo" className="h-9 w-auto" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors group ${
                  location.pathname === link.href
                    ? "text-orange-400"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {link.label}
                {location.pathname === link.href && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-orange-400 rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                {isAdmin && (
                  <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500" asChild>
                    <Link to="/admin">
                      <Settings className="h-3.5 w-3.5 mr-1.5" />
                      Admin
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/25 relative overflow-hidden group"
                  asChild
                >
                  <Link to="/contact">
                    <span className="relative z-10 flex items-center gap-1">
                      Get Started
                      <ChevronRight className="w-4 h-4" />
                    </span>
                    <span className="absolute inset-0 bg-white/10 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 skew-x-12" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="lg:hidden border-t border-white/5 py-4 space-y-1 bg-zinc-950/95 backdrop-blur-xl -mx-4 px-4 shadow-lg shadow-black/20">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.href
                    ? "text-orange-400 bg-orange-500/10"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/5 mt-3 flex flex-col gap-2">
              {user ? (
                <>
                  <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white" asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  {isAdmin && (
                    <Button variant="outline" className="w-full justify-start border-zinc-700 text-zinc-300" asChild>
                      <Link to="/admin">
                        <Settings className="h-4 w-4 mr-2" />
                        Admin
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button variant="ghost" className="w-full text-zinc-400 hover:text-white" asChild>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white border-0" asChild>
                    <Link to="/contact">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
