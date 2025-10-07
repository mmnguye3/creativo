import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useWhiteLabel } from "@/contexts/WhiteLabelContext";
import { ShoppingCart } from "lucide-react";

const AgencyPricing = () => {
  const { addItem } = useCart();
  const { agencySettings } = useWhiteLabel();
  
  const agencyName = agencySettings?.agency_name || "Our Agency";

  const packages = [
    {
      id: "starter-package",
      name: "Starter Package",
      price: 499,
      description: "Perfect for small businesses getting started",
      features: [
        "Logo design",
        "Basic brand guidelines",
        "Business card design",
        "Social media templates (5)",
        "1 revision round"
      ],
      popular: false
    },
    {
      id: "professional-package", 
      name: "Professional Package",
      price: 1299,
      description: "Complete branding solution for growing businesses",
      features: [
        "Complete brand identity",
        "Logo variations & guidelines",
        "Stationery package",
        "Social media ad designs (10)",
        "Website design mockup",
        "Email signature design",
        "3 revision rounds"
      ],
      popular: true
    },
    {
      id: "enterprise-package",
      name: "Enterprise Package", 
      price: 2999,
      description: "Full-service branding for established companies",
      features: [
        "Comprehensive brand strategy",
        "Complete visual identity system",
        "Marketing collateral package",
        "Social media campaign (20 pieces)",
        "Website design & development",
        "Print advertising materials",
        "Video branding elements",
        "Unlimited revisions for 30 days"
      ],
      popular: false
    }
  ];

  const handleAddToCart = (pkg: typeof packages[0]) => {
    addItem({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      price: pkg.price
    });
  };

  return (
    <section className="py-24 bg-gradient-to-b from-background/50 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Our Design
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Packages
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Professional design services tailored to your business needs. 
            Choose the package that fits your goals and budget.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {packages.map((pkg, index) => (
            <Card 
              key={index} 
              className={`relative bg-gradient-card border-white/10 hover:border-primary/20 transition-all duration-300 ${
                pkg.popular ? 'ring-2 ring-primary/20 shadow-glow' : ''
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-primary text-white px-4 py-1 rounded-full text-sm">
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${pkg.price}</span>
                  <span className="text-muted-foreground"> one-time</span>
                </div>
                <p className="text-muted-foreground mt-2">{pkg.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {pkg.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={pkg.popular ? "premium" : "hero"} 
                  size="lg" 
                  className="w-full"
                  onClick={() => handleAddToCart(pkg)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Ready to transform your brand? Contact {agencyName} today!
          </p>
          <p className="text-sm text-muted-foreground">
            All packages include dedicated project manager • Fast turnaround • 100% satisfaction guarantee
          </p>
        </div>
      </div>
    </section>
  );
};

export default AgencyPricing;