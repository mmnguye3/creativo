import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { 
  Palette, 
  Monitor, 
  Printer, 
  ShoppingBag,
  Mail,
  Video,
  Package,
  FileImage,
  Play,
  Brush,
  Plus,
  Check,
  Clock,
  Zap
} from "lucide-react";

const ServiceShowcase = () => {
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("popular");

  const serviceCategories = {
    popular: "Most Popular",
    branding: "Branding & Identity", 
    digital: "Digital Marketing",
    print: "Print & Packaging"
  };

  const services = {
    popular: [
      {
        id: "quick-graphic",
        title: "Quick Graphic Design",
        description: "Simple graphic design for social posts, quick edits, or basic visual needs",
        icon: FileImage,
        price: 5,
        turnaround: "2-6h",
        popular: true,
        features: ["1 graphic design", "Basic editing", "Social media ready", "Fast turnaround", "Budget friendly"]
      },
      {
        id: "logo-package",
        title: "Complete Logo Package",
        description: "Professional logo design with brand guidelines, multiple formats, and variations",
        icon: Brush,
        price: 100,
        originalPrice: 300,
        turnaround: "24-48h",
        popular: true,
        features: ["Logo design", "Brand guidelines", "Multiple file formats", "3 concepts", "Unlimited revisions"]
      },
      {
        id: "google-services",
        title: "Google Services Package",
        description: "Complete Google setup including Analytics, Search Console, and Business Profile optimization",
        icon: Monitor,
        price: 50,
        turnaround: "24h",
        popular: true,
        features: ["Google Analytics setup", "Search Console integration", "Business Profile optimization", "Goal tracking", "Performance reports"]
      },
      {
        id: "social-media-pack",
        title: "Social Media Pack",
        description: "Complete social media graphics package for consistent brand presence",
        icon: Palette,
        price: 130,
        originalPrice: 200,
        turnaround: "24h",
        popular: true,
        features: ["20 post templates", "Story templates", "Profile graphics", "Brand colors", "Ready to post"]
      },
      {
        id: "ad-creative",
        title: "Single Ad Creative",
        description: "Eye-catching ad creative perfect for social media campaigns",
        icon: FileImage,
        price: 10,
        turnaround: "24h",
        popular: true,
        features: ["1 ad design", "Social media ready", "High-res files", "Brand aligned", "Fast delivery"]
      },
      {
        id: "instagram-story",
        title: "Instagram Story Template",
        description: "Engaging Instagram story template to boost your engagement",
        icon: Video,
        price: 11,
        turnaround: "12h",
        popular: true,
        features: ["Story template", "Brand customized", "Multiple formats", "Animation ready", "Instant download"]
      }
    ],
    branding: [
      {
        id: "brand-identity",
        title: "Brand Identity Suite",
        description: "Complete brand identity with logo, colors, fonts, and style guide",
        icon: Brush,
        price: 290,
        turnaround: "5-7 days",
        features: ["Logo design", "Color palette", "Typography", "Brand guidelines", "Business cards"]
      },
      {
        id: "logo-only",
        title: "Logo Design Only",
        description: "Professional logo design with 3 concepts and unlimited revisions",
        icon: FileImage,
        price: 150,
        turnaround: "24-48h",
        features: ["3 logo concepts", "Unlimited revisions", "High-res files", "Vector formats"]
      }
    ],
    digital: [
      {
        id: "ad-creative",
        title: "Single Ad Creative",
        description: "Eye-catching ad creative perfect for social media campaigns",
        icon: FileImage,
        price: 10,
        turnaround: "24h",
        features: ["1 ad design", "Social media ready", "High-res files", "Brand aligned", "Fast delivery"]
      },
      {
        id: "instagram-story",
        title: "Instagram Story Template",
        description: "Engaging Instagram story template to boost your engagement",
        icon: Video,
        price: 11,
        turnaround: "12h",
        features: ["Story template", "Brand customized", "Multiple formats", "Animation ready", "Instant download"]
      },
      {
        id: "email-templates",
        title: "Email Marketing Templates",
        description: "Professional email templates that drive opens and clicks",
        icon: Mail,
        price: 180,
        turnaround: "24h",
        features: ["5 email templates", "Mobile responsive", "Brand customized", "Ready for Mailchimp"]
      },
      {
        id: "video-editing",
        title: "Video Editing Package",
        description: "Professional video editing for social media and marketing",
        icon: Play,
        price: 300,
        turnaround: "2-3 days",
        features: ["Up to 2 minutes", "Music & transitions", "Text overlays", "Brand colors", "Multiple formats"]
      },
      {
        id: "website-design",
        title: "Website Design", 
        description: "Modern, responsive website design that converts visitors into customers",
        icon: Monitor,
        price: 250,
        originalPrice: 400,
        turnaround: "3-5 days",
        features: ["5-page design", "Mobile responsive", "SEO optimized", "Contact forms", "Social integration"]
      }
    ],
    print: [
      {
        id: "business-cards",
        title: "Business Card Design",
        description: "Professional business cards that make lasting impressions",
        icon: Printer,
        price: 90,
        turnaround: "24h",
        features: ["Front & back design", "Print-ready files", "Premium layouts", "Multiple concepts"]
      },
      {
        id: "packaging-design",
        title: "Product Packaging",
        description: "Eye-catching packaging design that sells your product",
        icon: Package,
        price: 300,
        turnaround: "5-7 days",
        features: ["Die-cut design", "3D mockups", "Print specifications", "Label design", "Brand integration"]
      }
    ]
  };

  const handleAddToCart = (service: any) => {
    addItem({
      id: service.id,
      name: service.title,
      description: service.description,
      price: service.price
    });
  };

  return (
    <section id="services" className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black">
            Choose Your Design Service
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional design work delivered fast. Pick what you need, add to cart, and we'll get started immediately.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {Object.entries(serviceCategories).map(([key, label]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              onClick={() => setSelectedCategory(key)}
              className={`px-6 py-2 rounded-full ${
                selectedCategory === key 
                  ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600" 
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services[selectedCategory as keyof typeof services]
            .sort((a, b) => a.price - b.price)
            .map((service, index) => (
            <Card 
              key={service.id} 
              className="relative bg-white border-2 hover:border-purple-200 transition-all duration-300 hover:shadow-2xl group"
            >
              {(service as any).popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-4 py-1 rounded-full">
                    🔥 Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:from-purple-200 group-hover:to-blue-200 transition-colors">
                  <service.icon className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-bold text-black mb-2">{service.title}</CardTitle>
                <p className="text-gray-600 text-sm">{service.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl font-bold text-black">${service.price}</span>
                    {(service as any).originalPrice && (
                      <span className="text-lg text-gray-400 line-through">${(service as any).originalPrice}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{service.turnaround}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      <span>Fast delivery</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button 
                  onClick={() => handleAddToCart(service)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add to Cart - ${service.price}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 p-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl">
          <h3 className="text-2xl font-bold mb-4 text-black">Need Something Custom?</h3>
          <p className="text-gray-600 mb-6">
            Don't see exactly what you need? We create custom design solutions for any project.
          </p>
          <Button 
            variant="outline" 
            className="border-purple-500 text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-500 hover:text-white"
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Request Custom Quote
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServiceShowcase;