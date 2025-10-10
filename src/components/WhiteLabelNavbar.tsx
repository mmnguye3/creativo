import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWhiteLabel } from "@/contexts/WhiteLabelContext";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface WhiteLabelNavbarProps {}

const WhiteLabelNavbar = ({}: WhiteLabelNavbarProps) => {
  const { agencySettings, agencySlug } = useWhiteLabel();
  const { cart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const agencyName = agencySettings?.agency_name || "Creative Agency";
  const logoUrl = agencySettings?.logo_url;

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            {logoUrl ? (
              <img src={logoUrl} alt={agencyName} className="h-20 w-auto" />
            ) : (
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {agencyName}
              </span>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('services')}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Contact
            </button>
          </div>

          {/* Cart and Mobile Menu */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/${agencySlug}/cart`)}
              className="flex items-center gap-2 border border-border hover:border-transparent"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.items.length > 0 && (
                <Badge 
                  variant="secondary" 
                  className="text-sm font-medium px-2 py-1"
                >
                  ${cart.total.toFixed(2)}
                </Badge>
              )}
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border/40 py-4">
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => scrollToSection('services')}
                className="text-left text-foreground/80 hover:text-foreground transition-colors"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-left text-foreground/80 hover:text-foreground transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-left text-foreground/80 hover:text-foreground transition-colors"
              >
                Contact
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default WhiteLabelNavbar;