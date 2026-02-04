import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
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
  Brush,
  Play
} from "lucide-react";

// Import service images
import socialMediaImg from "@/assets/services/social-media-graphics.jpg";
import presentationsImg from "@/assets/services/presentations.jpg";
import motionGraphicsImg from "@/assets/services/motion-graphics.jpg";
import logoBrandingImg from "@/assets/services/logo-branding.jpg";
import illustrationsImg from "@/assets/services/illustrations.jpg";
import emailTemplatesImg from "@/assets/services/email-templates.jpg";
import ecommerceImg from "@/assets/services/ecommerce-graphics.jpg";
import videoEditingImg from "@/assets/services/video-editing.jpg";
import packagingImg from "@/assets/services/packaging-design.jpg";
import webDesignImg from "@/assets/services/web-design.jpg";
import contentCreationImg from "@/assets/services/content-creation.jpg";
import printDesignImg from "@/assets/services/print-design.jpg";

const Services = () => {
  const services = [
    {
      icon: Palette,
      title: "Social Media Graphics",
      description: "Eye-catching social media designs that boost engagement and grow your following",
      popular: true,
      link: "/services#social-media-graphics",
      image: socialMediaImg
    },
    {
      icon: Presentation,
      title: "Presentations",
      description: "Professional presentations that communicate your message clearly and effectively",
      link: "/services#presentations",
      image: presentationsImg
    },
    {
      icon: Play,
      title: "Motion Graphics",
      description: "Dynamic animations and motion graphics that bring your brand to life",
      link: "/services#motion-graphics",
      image: motionGraphicsImg
    },
    {
      icon: Brush,
      title: "Logo & Brand Identity",
      description: "Distinctive brand identities that build recognition and trust with your audience",
      link: "/services#logos-branding",
      image: logoBrandingImg
    },
    {
      icon: FileImage,
      title: "Custom Illustrations",
      description: "Original illustrations that tell your brand's unique story and captivate audiences",
      link: "/services#illustrations",
      image: illustrationsImg
    },
    {
      icon: Mail,
      title: "Email Templates",
      description: "Professional email designs that drive opens, clicks, and conversions",
      link: "/services#email-templates",
      image: emailTemplatesImg
    },
    {
      icon: ShoppingBag,
      title: "E-commerce Graphics",
      description: "Product images and graphics that convert browsers into buyers",
      link: "/services#ecommerce-graphics",
      image: ecommerceImg
    },
    {
      icon: Video,
      title: "Video Editing",
      description: "Professional video editing that engages viewers and drives action",
      link: "/services#video-editing",
      image: videoEditingImg
    },
    {
      icon: Package,
      title: "Packaging Design",
      description: "Product packaging that stands out on shelves and drives sales",
      link: "/services#packaging",
      image: packagingImg
    },
    {
      icon: Monitor,
      title: "Web Design",
      description: "Modern, responsive websites that convert visitors into customers",
      link: "/services#website-design",
      image: webDesignImg
    },
    {
      icon: Video,
      title: "Content Creation",
      description: "Engaging visual content for all your marketing channels",
      link: "/services#content-creation",
      image: contentCreationImg
    },
    {
      icon: Printer,
      title: "Print Design",
      description: "High-impact print materials that make lasting impressions",
      link: "/services#print-design",
      image: printDesignImg
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-orange-50/30 via-amber-50/20 to-background relative overflow-hidden">
      {/* Decorative underlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100/20 via-transparent to-amber-100/20"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            What We <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Create</span>
          </h2>
          <p className="text-xl text-black font-bold">
            From stunning brand identities to engaging digital content, we deliver professional designs that help your business succeed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className={`bg-gradient-to-br from-gray-900/95 via-black/90 to-gray-800/95 border-gray-700/50 hover:border-orange-500/40 transition-all duration-500 hover:shadow-card group relative hover-lift animate-fade-in-up text-white hover:scale-105 hover:z-20 hover:-translate-y-2 overflow-hidden ${
                service.popular ? 'ring-2 ring-orange-500/50 animate-pulse-glow bg-gradient-to-br from-gray-800/95 via-black/90 to-orange-900/30' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {service.popular && (
                <div className="absolute -top-3 left-4 z-10">
                  <div className="bg-gradient-primary text-white px-3 py-1 rounded-full text-xs">
                    Most Popular
                  </div>
                </div>
              )}
              {/* Service Image */}
              <div className="relative h-40 overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
              </div>
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-glow transition-colors">
                  {service.title}
                </h3>
                <p className="text-white font-bold text-sm leading-relaxed mb-4">
                  {service.description}
                </p>
                <Button variant="ghost" size="sm" className="text-primary-glow hover:text-primary" asChild>
                  <Link to={service.link}>Learn More →</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="hero" size="lg" asChild>
            <Link to="/services">View All Services</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Services;
