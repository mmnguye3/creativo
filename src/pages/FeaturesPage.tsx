import { useState, useEffect } from 'react';
import Features from "@/components/Features";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, 
  Zap, 
  Users, 
  BarChart3, 
  Clock, 
  Globe,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShoppingCart,
  CreditCard,
} from "lucide-react";

const FeaturesPage = () => {
  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setHeroVisible(true), 80); return () => clearTimeout(t); }, []);

  const additionalFeatures = [
    {
      category: "Platform Features",
      items: [
        {
          icon: Shield,
          title: "Enterprise Security",
          description: "Bank-level security with SSL encryption, secure data storage, and regular security audits.",
          benefits: ["SSL Encryption", "Data Backup", "Access Controls", "Security Monitoring"]
        },
        {
          icon: Zap,
          title: "Lightning Fast",
          description: "Optimized performance with CDN integration and caching for instant loading times.",
          benefits: ["CDN Integration", "Auto Caching", "Image Optimization", "Fast Hosting"]
        },
        {
          icon: Users,
          title: "Team Collaboration",
          description: "Built-in tools for team communication, project management, and client collaboration.",
          benefits: ["Team Chat", "File Sharing", "Project Tracking", "Client Portal"]
        }
      ]
    },
    {
      category: "Analytics & Insights",
      items: [
        {
          icon: BarChart3,
          title: "Advanced Analytics",
          description: "Comprehensive analytics dashboard to track performance and make data-driven decisions.",
          benefits: ["Real-time Data", "Custom Reports", "Performance Metrics", "ROI Tracking"]
        },
        {
          icon: Clock,
          title: "Time Tracking",
          description: "Built-in time tracking tools to monitor project progress and optimize workflows.",
          benefits: ["Project Timers", "Productivity Reports", "Billing Integration", "Team Insights"]
        },
        {
          icon: Globe,
          title: "Global Reach",
          description: "Multi-language support and global infrastructure to serve clients worldwide.",
          benefits: ["Multi-language", "Global CDN", "Local Payment", "24/7 Support"]
        }
      ]
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — copy */}
            <div>
              <p className="text-orange-400 text-xs font-bold tracking-[0.18em] uppercase mb-4"
                style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity 0.55s ease, transform 0.55s ease', transitionDelay: '0s' }}>
                Features
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.08] mb-5"
                style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.6s ease, transform 0.6s ease', transitionDelay: '0.08s' }}>
                Built so you can{' '}
                <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  sell, not fulfill
                </span>
              </h1>
              <p className="text-zinc-400 text-lg leading-relaxed mb-8 max-w-lg"
                style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity 0.6s ease, transform 0.6s ease', transitionDelay: '0.17s' }}>
                Your brand on the storefront, our engine underneath — AI generation, order management, and payments handled for you.
              </p>
              <div
                style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.6s ease, transform 0.6s ease', transitionDelay: '0.26s' }}>
                <Button
                  onClick={() => document.getElementById('features-grid')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-6 h-11 shadow-lg shadow-orange-500/25"
                >
                  Explore Features
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Right — feature chips */}
            <div className="flex flex-col gap-3"
              style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.7s ease, transform 0.7s ease', transitionDelay: '0.15s' }}>
              {[
                { icon: Globe, title: 'White-label storefront', desc: 'Your domain, your logo, your prices', color: 'bg-blue-500/10 text-blue-400' },
                { icon: Sparkles, title: 'AI ad & content generation', desc: 'Client-ready creative in seconds', color: 'bg-violet-500/10 text-violet-400' },
                { icon: ShoppingCart, title: 'Order & client management', desc: 'Briefs, revisions, delivery in one place', color: 'bg-orange-500/10 text-orange-400' },
                { icon: CreditCard, title: 'Payments & invoicing', desc: 'Get paid under your own brand', color: 'bg-green-500/10 text-green-400' },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div key={title}
                  className="flex items-center gap-4 bg-white/[0.03] border border-white/8 rounded-2xl px-5 py-4 hover:border-orange-500/20 transition-colors">
                  <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{title}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div id="features-grid">
        {/* Main Features Component */}
        <Features />
      </div>

      {/* Additional Feature Categories */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          {additionalFeatures.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">{category.category}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {category.items.map((feature, index) => (
                  <Card key={index} className="hover-lift bg-gradient-card border-white/10">
                    <CardHeader>
                      <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {feature.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span className="text-sm">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Why Choose Our Platform?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See how our features compare to building your own solution or using basic alternatives.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 border-primary bg-gradient-card">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-primary">Our Platform</CardTitle>
                <CardDescription>Complete white-label solution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "Ready in minutes",
                  "Full customization",
                  "Ongoing updates",
                  "24/7 support",
                  "No technical knowledge needed",
                  "Affordable pricing"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-white/10">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Custom Development</CardTitle>
                <CardDescription>Building from scratch</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "6-12 months development",
                  "High upfront costs",
                  "Ongoing maintenance",
                  "Technical expertise required",
                  "Security vulnerabilities",
                  "No guaranteed results"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-white/10">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Basic Tools</CardTitle>
                <CardDescription>Simple website builders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "Limited customization",
                  "Basic functionality",
                  "Template restrictions",
                  "No white-labeling",
                  "Limited integrations",
                  "Poor scalability"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;