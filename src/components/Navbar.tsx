import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/cretivo-logo.png" 
              alt="Cretivo" 
              className="h-16 w-auto" 
            />
          </Link>

          {/* Center Navigation for larger screens */}
          <div className="hidden lg:flex flex-1 justify-center">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-4">
                {/* Desktop Navigation */}
                <nav className="hidden lg:flex space-x-6">
                  <Link to="/" className="text-black hover:text-primary transition-colors">
                    Home
                  </Link>
                  <Link to="/services" className="text-black hover:text-primary transition-colors">
                    Services
                  </Link>
                  <Link to="/features" className="text-black hover:text-primary transition-colors">
                    Features
                  </Link>
                  <Link to="/pricing" className="text-black hover:text-primary transition-colors">
                    Pricing
                  </Link>
                  <Link to="/about" className="text-black hover:text-primary transition-colors">
                    About
                  </Link>
                  <Link to="/contact" className="text-black hover:text-primary transition-colors">
                    Contact
                  </Link>
                </nav>

                {/* Desktop Auth Buttons */}
                <div className="hidden lg:flex items-center space-x-3">
                  {user ? (
                    <>
                      <Button variant="ghost" asChild>
                        <Link to="/dashboard">Dashboard</Link>
                      </Button>
                      {isAdmin && (
                        <Button variant="outline" asChild>
                          <Link to="/admin">
                            <Settings className="h-4 w-4 mr-2" />
                            Admin
                          </Link>
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" asChild>
                        <Link to="/auth">Sign In</Link>
                      </Button>
                      <Button variant="hero" asChild>
                        <Link to="/contact">Get Started</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden text-gray-700"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              {/* Mobile Navigation Links */}
              <div className="flex flex-col space-y-3">
                <Link 
                  to="/" 
                  className="text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  to="/services" 
                  className="text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Services
                </Link>
                <Link 
                  to="/features" 
                  className="text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  to="/pricing" 
                  className="text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  to="/about" 
                  className="text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  About
                </Link>
                <Link 
                  to="/contact" 
                  className="text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Contact
                </Link>
              </div>

              {/* Mobile Auth Buttons */}
              <div className="flex flex-col space-y-3 pt-4 border-t border-border">
                {user ? (
                  <>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
                    </Button>
                    {isAdmin && (
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/admin" onClick={() => setIsOpen(false)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Admin
                        </Link>
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button variant="default" className="w-full" asChild>
                      <Link to="/auth" onClick={() => setIsOpen(false)}>Sign In</Link>
                    </Button>
                    <Button variant="hero" className="w-full" asChild>
                      <Link to="/contact" onClick={() => setIsOpen(false)}>Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;