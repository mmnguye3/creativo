import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useInView } from "@/hooks/useInView";
import { Palette, Video, FileImage, Monitor, Package, Mail, ShoppingBag, Printer, Presentation, Brush, Play } from "lucide-react";

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

const services = [
  { icon: Palette, title: "Social Media Graphics", description: "Eye-catching social media designs that boost engagement and grow your following", popular: true, link: "/services#social-media-graphics", image: socialMediaImg },
  { icon: Presentation, title: "Presentations", description: "Professional presentations that communicate your message clearly and effectively", link: "/services#presentations", image: presentationsImg },
  { icon: Play, title: "Motion Graphics", description: "Dynamic animations and motion graphics that bring your brand to life", link: "/services#motion-graphics", image: motionGraphicsImg },
  { icon: Brush, title: "Logo & Brand Identity", description: "Distinctive brand identities that build recognition and trust", link: "/services#logos-branding", image: logoBrandingImg },
  { icon: FileImage, title: "Custom Illustrations", description: "Original illustrations that tell your brand's unique story", link: "/services#illustrations", image: illustrationsImg },
  { icon: Mail, title: "Email Templates", description: "Professional email designs that drive opens, clicks, and conversions", link: "/services#email-templates", image: emailTemplatesImg },
  { icon: ShoppingBag, title: "E-commerce Graphics", description: "Product images and graphics that convert browsers into buyers", link: "/services#ecommerce-graphics", image: ecommerceImg },
  { icon: Video, title: "Video Editing", description: "Professional video editing that engages viewers and drives action", link: "/services#video-editing", image: videoEditingImg },
  { icon: Package, title: "Packaging Design", description: "Product packaging that stands out on shelves and drives sales", link: "/services#packaging", image: packagingImg },
  { icon: Monitor, title: "Web Design", description: "Modern, responsive websites that convert visitors into customers", link: "/services#website-design", image: webDesignImg },
  { icon: Video, title: "Content Creation", description: "Engaging visual content for all your marketing channels", link: "/services#content-creation", image: contentCreationImg },
  { icon: Printer, title: "Print Design", description: "High-impact print materials that make lasting impressions", link: "/services#print-design", image: printDesignImg },
];

const Services = () => {
  const { ref: titleRef, inView: titleVisible } = useInView({ threshold: 0.3 });
  const { ref: gridRef, inView: gridVisible } = useInView({ threshold: 0.05 });

  return (
    <section className="py-24 bg-zinc-900/40 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Heading */}
        <div
          ref={titleRef as React.RefObject<HTMLDivElement>}
          className="text-center max-w-2xl mx-auto mb-14"
          style={{
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-sm text-orange-400 mb-5">
            What We Create
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Design Services That{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Drive Results
            </span>
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            From stunning brand identities to engaging digital content — we deliver professional designs that help your business succeed.
          </p>
        </div>

        {/* Grid */}
        <div
          ref={gridRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12"
        >
          {services.map((service, index) => (
            <div
              key={index}
              className={`group rounded-2xl bg-white/[0.03] border overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                service.popular
                  ? "border-orange-500/30 hover:border-orange-500/50"
                  : "border-white/8 hover:border-orange-500/25 hover:bg-white/[0.05]"
              }`}
              style={{
                opacity: gridVisible ? 1 : 0,
                transform: gridVisible ? "translateY(0)" : "translateY(28px)",
                transition: `opacity 0.5s ease ${(index % 6) * 0.08}s, transform 0.5s ease ${(index % 6) * 0.08}s, border-color 0.3s`,
              }}
            >
              {service.popular && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg shadow-orange-500/30">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
              </div>
              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0 group-hover:bg-orange-500/30 transition-colors duration-300">
                    <service.icon className="w-4 h-4 text-orange-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-orange-300 transition-colors leading-tight pt-1">
                    {service.title}
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed mb-4">{service.description}</p>
                <Link
                  to={service.link}
                  className="text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center gap-1 group/link"
                >
                  Learn more
                  <span className="group-hover/link:translate-x-0.5 transition-transform inline-block">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/20 px-10 relative overflow-hidden group"
            asChild
          >
            <Link to="/services">
              <span className="relative z-10">View All Services</span>
              <span className="absolute inset-0 bg-white/10 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 skew-x-12" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Services;
