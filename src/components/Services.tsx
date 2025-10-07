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
  Layers,
  Brush,
  Play
} from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: Palette,
      title: "Social Media Graphics",
      description: "Eye-catching social media designs that boost engagement and grow your following",
      popular: true,
      link: "/services#social-media-graphics"
    },
    {
      icon: Presentation,
      title: "Presentations",
      description: "Professional presentations that communicate your message clearly and effectively",
      link: "/services#presentations"
    },
    {
      icon: Play,
      title: "Motion Graphics",
      description: "Dynamic animations and motion graphics that bring your brand to life",
      link: "/services#motion-graphics"
    },
    {
      icon: Brush,
      title: "Logo & Brand Identity",
      description: "Distinctive brand identities that build recognition and trust with your audience",
      link: "/services#logos-branding"
    },
    {
      icon: FileImage,
      title: "Custom Illustrations",
      description: "Original illustrations that tell your brand's unique story and captivate audiences",
      link: "/services#illustrations"
    },
    {
      icon: Mail,
      title: "Email Templates",
      description: "Professional email designs that drive opens, clicks, and conversions",
      link: "/services#email-templates"
    },
    {
      icon: ShoppingBag,
      title: "E-commerce Graphics",
      description: "Product images and graphics that convert browsers into buyers",
      link: "/services#ecommerce-graphics"
    },
    {
      icon: Video,
      title: "Video Editing",
      description: "Professional video editing that engages viewers and drives action",
      link: "/services#video-editing"
    },
    {
      icon: Package,
      title: "Packaging Design",
      description: "Product packaging that stands out on shelves and drives sales",
      link: "/services#packaging"
    },
    {
      icon: Monitor,
      title: "Web Design",
      description: "Modern, responsive websites that convert visitors into customers",
      link: "/services#website-design"
    },
    {
      icon: Video,
      title: "Content Creation",
      description: "Engaging visual content for all your marketing channels",
      link: "/services#content-creation"
    },
    {
      icon: Printer,
      title: "Print Design",
      description: "High-impact print materials that make lasting impressions",
      link: "/services#print-design"
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-purple-50/30 via-blue-50/20 to-background relative overflow-hidden">
      {/* Decorative underlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-transparent to-blue-100/20"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            What We <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">Create</span>
          </h2>
          <p className="text-xl text-black font-bold">
            From stunning brand identities to engaging digital content, we deliver professional designs that help your business succeed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className={`bg-gradient-to-br from-gray-900/95 via-black/90 to-gray-800/95 border-gray-700/50 hover:border-purple-500/40 transition-all duration-500 hover:shadow-card group relative hover-lift animate-fade-in-up text-white hover:scale-110 hover:z-20 hover:-translate-y-2 hover:rotate-1 ${
                service.popular ? 'ring-2 ring-purple-500/50 animate-pulse-glow bg-gradient-to-br from-gray-800/95 via-black/90 to-purple-900/30' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {service.popular && (
                <div className="absolute -top-3 left-4">
                  <div className="bg-gradient-primary text-white px-3 py-1 rounded-full text-xs">
                    Most Popular
                  </div>
                </div>
              )}
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