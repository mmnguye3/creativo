import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2, 
  HelpCircle, 
  Star,
  Users,
  Building,
  Zap,
  Palette,
  Video,
  Monitor,
  Mail,
  Package,
  Printer
} from "lucide-react";

const PricingPage = () => {
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setHeroVisible(true), 80); return () => clearTimeout(t); }, []);
  const services = [
    {
      name: "Design Services",
      description: "Complete design solutions for all your creative needs",
      icon: Palette,
      features: ["Social Media Graphics", "Logo & Branding", "Print Design", "Illustrations", "Packaging Design"]
    },
    {
      name: "Video Content",
      description: "Professional video editing and motion graphics",
      icon: Video,
      features: ["Short Form Video Editing", "Long Form Video Editing", "Motion Graphics", "Video Ads", "Animated Explainers"]
    },
    {
      name: "Web Development",
      description: "Modern websites and digital experiences",
      icon: Monitor,
      features: ["Website Design", "Landing Pages", "UI/UX Design", "Figma Prototypes", "Responsive Design"]
    },
    {
      name: "Marketing Materials",
      description: "Professional marketing and promotional content",
      icon: Mail,
      features: ["Email Templates", "Presentations", "Brochures", "Flyers", "Sales Materials"]
    },
    {
      name: "E-commerce Solutions",
      description: "Everything you need for online selling",
      icon: Package,
      features: ["Amazon A+ Content", "Product Photography", "Storefront Design", "Listing Optimization", "Product Mockups"]
    },
    {
      name: "Print & Packaging",
      description: "High-quality print design and packaging solutions",
      icon: Printer,
      features: ["Business Cards", "Packaging Design", "Labels", "Banners", "Signage Design"]
    }
  ];

  const designPlans = [
    {
      name: "Digital Ads",
      company: "Social Media Focus",
      plan: "Comprehensive",
      content: "Get all your social media graphic and video ads delivered on time, every single time.",
      rating: 5,
      features: ["All social platforms", "Video and graphic ads", "A/B testing variations", "Revision management"]
    },
    {
      name: "E-commerce",
      company: "Online Business",
      plan: "Complete Package",
      content: "Everything you need to run a successful e-commerce brand and drive more sales.",
      rating: 5,
      features: ["Product photography", "Amazon content", "Storefront design", "Email marketing"]
    },
    {
      name: "Marketing Agency",
      company: "Agency Solutions",
      plan: "Scalable",
      content: "Scale your agency with stunning designs without increasing your overhead.",
      rating: 5,
      features: ["Multi-brand management", "White-label solutions", "Priority support", "Dedicated manager"]
    }
  ];

  const faqs = [
    {
      question: "What services can agencies offer to their clients?",
      answer: "The platform provides access to comprehensive design services including social media graphics, video editing, web design, print materials, branding, and more. Full service catalog available for white-label delivery."
    },
    {
      question: "How does the revision process work for agencies?",
      answer: "Agencies can manage revisions through the platform's workflow system, allowing them to maintain quality control and client satisfaction while streamlining the feedback process."
    },
    {
      question: "What are typical project turnaround times?",
      answer: "Standard turnaround times range from 24-48 hours for simple graphics to 3-7 days for complex projects. Agencies can set their own client expectations based on these timelines."
    },
    {
      question: "Is this suitable for agencies of all sizes?",
      answer: "Yes! The platform scales from solo consultants to large agency operations. Features and pricing tiers accommodate different business models and client volumes."
    },
    {
      question: "Can multiple client projects be managed simultaneously?",
      answer: "Absolutely! The platform is designed to handle multiple client projects across different service areas while maintaining organization and meeting deadlines."
    },
    {
      question: "What file formats are delivered?",
      answer: "All standard formats are provided including PNG, JPG, PDF, SVG, MP4, MOV, and source files like PSD, AI, and Figma files for maximum client flexibility."
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-orange-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-orange-400 text-xs font-bold tracking-[0.18em] uppercase mb-4"
              style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity 0.55s ease, transform 0.55s ease', transitionDelay: '0s' }}>
              Pricing
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.08] mb-5"
              style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.6s ease, transform 0.6s ease', transitionDelay: '0.08s' }}>
              Start your agency for less than{' '}
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                one client pays you
              </span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed mb-8"
              style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity 0.6s ease, transform 0.6s ease', transitionDelay: '0.17s' }}>
              Plans from $297/mo. One retainer client covers it — everything after that is margin.
            </p>
            <div className="mb-8"
              style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.6s ease, transform 0.6s ease', transitionDelay: '0.26s' }}>
              <Button
                onClick={() => document.getElementById('pricing-plans')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-8 h-12 text-base shadow-lg shadow-orange-500/25"
              >
                See Plans
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-2.5"
              style={{ opacity: heroVisible ? 1 : 0, transition: 'opacity 0.6s ease', transitionDelay: '0.36s' }}>
              {['No contracts', 'Cancel anytime', '1,200+ agencies launched', 'Live in 24 hours'].map(badge => (
                <span key={badge}
                  className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full px-3.5 py-1.5 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Available Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Complete service portfolio available for agencies to offer their clients across all design categories.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="hover-lift bg-gradient-card border-white/10">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{service.name}</CardTitle>
                  <CardDescription className="text-base">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {service.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary-glow" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Design Plans */}
      <section id="pricing-plans" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Design Plans</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive design solutions tailored to your specific business needs and goals.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {designPlans.map((plan, index) => (
              <Card key={index} className="bg-gradient-card border-white/10">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(plan.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-base italic mb-4">
                    "{plan.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary-glow" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="hero" className="w-full">
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Have questions about our services? We've got answers.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-gradient-card border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">Ready to launch your agency?</p>
            <Button variant="hero" size="lg" onClick={() => navigate("/contact")}>
              Start Your Agency
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;