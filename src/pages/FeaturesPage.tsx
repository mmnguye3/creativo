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
  CheckCircle2
} from "lucide-react";

const FeaturesPage = () => {
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
      <section className="relative py-20 bg-gradient-hero">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Platform <span className="bg-gradient-primary bg-clip-text text-transparent">Features</span>
          </h1>
          <p className="text-xl text-white max-w-3xl mx-auto mb-8">
            Discover all the powerful features that make our white-label platform the perfect choice for your design agency.
          </p>
        </div>
      </section>

      {/* Main Features Component */}
      <Features />

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