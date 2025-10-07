import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Palette, 
  Video, 
  FileImage,
  Monitor,
  Package,
  Mail,
  ShoppingBag,
  Printer,
  Presentation,
  Layers,
  Brush,
  Play,
  Megaphone,
  TrendingUp,
  Zap,
  Globe,
  Check,
  ArrowRight,
  Camera,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Twitter,
  Image,
  Mic,
  Edit,
  Sparkles,
  Gift,
  PenTool,
  FileText,
  BookOpen,
  Shirt,
  Car
} from "lucide-react";

const ServicesPage = () => {
  const serviceCategories = [
    {
      title: "Digital Ads",
      icon: Megaphone,
      services: [
        "Graphic Meta Ads",
        "Graphic Tiktok Ads", 
        "Google Display Ads",
        "Graphic Instagram Ads",
        "Graphic Pinterest Ads",
        "Graphic Twitter/X Ads",
        "Graphic LinkedIn Ads",
        "Graphic Carousel Ads",
        "Video Meta Ads <1 min",
        "Video Tiktok Ads <1 min",
        "Video Instagram Ads <1 min",
        "Video Pinterest Ads <1 min",
        "Video LinkedIn Ads <1 min",
        "Youtube Shorts Ads <1 min",
        "Video Twitter/X Ads <1 min"
      ]
    },
    {
      title: "Social Media Content",
      icon: Instagram,
      services: [
        "Simple GIFs",
        "Social Feed Graphics",
        "Story Graphics",
        "Cover Images",
        "Podcast Cover Art",
        "Meta Banners",
        "Twitch Banners",
        "Twitter/X Banners",
        "YouTube Banners",
        "YouTube Thumbnails",
        "Blog Graphics",
        "Background Removal",
        "Static Design Animations",
        "Icon Animations",
        "Text Overlays <1 min"
      ]
    },
    {
      title: "Video Content",
      icon: Video,
      services: [
        "Captions <1 min",
        "Cinemagraphs",
        "Product Highlights <1 min",
        "Transcriptions <2 min",
        "UGC Mashups <1 min",
        "English AI Voiceover",
        "Video Openers/Titles",
        "Explainer Videos",
        "Lottie Animations",
        "Advanced GIFs",
        "Animated Explainer Video <1 min",
        "Listing Videos <2 mins",
        "Premium AI Voiceover <2 mins"
      ]
    },
    {
      title: "E-commerce Content",
      icon: ShoppingBag,
      services: [
        "Canva Graphics",
        "Canva Videos",
        "Listing Images",
        "A+/EBC",
        "A+ Premium",
        "Brand Story",
        "Storefront Modules",
        "Product Mockups",
        "Lifestyle Images",
        "Product Infographs",
        "Photo Editing",
        "Listing Videos <5 mins",
        "Product Highlights <5 mins"
      ]
    },
    {
      title: "Email Design",
      icon: Mail,
      services: [
        "Email Template",
        "Email Graphics",
        "Email Signatures",
        "Email Banners",
        "Email Header",
        "Email Footer"
      ]
    },
    {
      title: "Illustrations & Graphics",
      icon: Brush,
      services: [
        "Website Banner",
        "Icons",
        "Characters",
        "Mascots",
        "Flat Illustrations",
        "Charts/Graphs",
        "Animated Logos"
      ]
    },
    {
      title: "Packaging & Branding",
      icon: Package,
      services: [
        "Package Design",
        "Packaging Insert",
        "Labels",
        "Logo Design",
        "Brand Style Guide",
        "Brand Colors",
        "Patterns",
        "Vector Tracing"
      ]
    },
    {
      title: "Print Design",
      icon: Printer,
      services: [
        "Business Cards",
        "Banners",
        "Catalog Design <5 pages",
        "Flyer Design",
        "Brochure Design",
        "Poster Design",
        "Signage Design",
        "Album Covers",
        "Book Covers",
        "Postcards",
        "Certificates/Awards",
        "Menu Design",
        "Stationary",
        "Invitations",
        "Trade Show Banners",
        "T-Shirts",
        "Billboard Design",
        "Stickers"
      ]
    },
    {
      title: "Presentations & Documents",
      icon: Presentation,
      services: [
        "Slide Deck Design <10 slides",
        "Slide Deck Templates",
        "Slide Deck Graphics",
        "Infographics",
        "Newsletters",
        "Sales Sheets",
        "eBook Cover",
        "Pitch Deck",
        "PDF <10 Pages",
        "Slide Deck Design <20 slides",
        "PDF <20 Pages"
      ]
    },
    {
      title: "Long Form Video",
      icon: Camera,
      services: [
        "Meta Ads <3 mins",
        "Tiktok Ads <3 mins",
        "Instagram Ads <3 mins",
        "Pinterest Ads <3 mins",
        "LinkedIn Ads <3 mins",
        "Youtube Shorts Ads <3 mins",
        "Twitter/X Ads <3 mins",
        "Text Overlays <3 mins",
        "Captions <5 mins",
        "Custom Captions <3 mins",
        "Simple Character Animations",
        "Standard Long Form Edit <5 mins",
        "Event Promos <3 mins",
        "B-roll Explainer Video <3 mins",
        "Sizzle Reel <1 min",
        "Standard Long Form Edit <10 mins",
        "Event Promos <5 mins",
        "B-roll Explainer Video <5 mins",
        "Condensing Long Videos",
        "Video Sales Letter",
        "Sizzle Reel <3 mins",
        "Pro Long Form Edit",
        "UGC Mashups <5 mins",
        "Captions <10 mins"
      ]
    },
    {
      title: "Web Design",
      icon: Monitor,
      services: [
        "Page Section",
        "Landing Page",
        "Website Graphics",
        "Website Design",
        "Wireframe",
        "Simple UI Kit",
        "Simple APP UI Design",
        "Figma Prototype",
        "Vehicle Wraps"
      ]
    }
  ];

  const designPlans = [
    {
      icon: Megaphone,
      title: "Digital Ads",
      description: "Get all your social media graphic and video ads delivered on time, every single time, like a well-oiled machine."
    },
    {
      icon: TrendingUp,
      title: "Ecom",
      description: "Get all the graphic & video creatives you need to run a successful e-commerce brand and drive more sales."
    },
    {
      icon: Zap,
      title: "Marketing",
      description: "Scale your agency with stunning designs for every single one of your brands without increasing your overhead."
    },
    {
      icon: Globe,
      title: "Full Stack",
      description: "Build and launch websites or take advantage of all the other design types we have to offer with unlimited revisions included."
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-hero">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Our <span className="bg-gradient-primary bg-clip-text text-transparent">Services</span>
          </h1>
          <p className="text-xl text-white max-w-3xl mx-auto mb-8">
            From social media ads to complete brand packages, we've got all your design needs covered.
          </p>
        </div>
      </section>

      {/* All Services Section */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              All <span className="bg-gradient-primary bg-clip-text text-transparent">Services</span>
            </h2>
            <p className="text-xl text-white">
              Complete list of our design services organized by category.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {serviceCategories.map((category, categoryIndex) => (
              <Card 
                key={categoryIndex} 
                className="bg-gradient-card border-white/10 hover:border-primary/20 transition-all duration-300 hover:shadow-card hover-lift animate-fade-in-up"
                style={{ animationDelay: `${categoryIndex * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <category.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(category.services || []).map((service, serviceIndex) => (
                      <div key={serviceIndex} className="flex items-center gap-2 py-1">
                        <Check className="w-4 h-4 text-primary-glow flex-shrink-0" />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Design Plans Section */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Design <span className="bg-gradient-primary bg-clip-text text-transparent">Plans</span>
            </h2>
            <p className="text-xl text-white">
              Comprehensive design solutions tailored to your specific business needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {designPlans.map((plan, index) => (
              <Card key={index} className="bg-gradient-card border-white/10 hover:border-primary/20 transition-all duration-300 hover:shadow-card hover-lift">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <plan.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{plan.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base leading-relaxed">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="hero" size="lg" className="w-full group">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-background/50 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your 
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                Business?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of businesses that trust us with their design needs. 
              Get started today and see the difference professional design can make.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" asChild>
                <Link to="/contact">Get Started Today</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;