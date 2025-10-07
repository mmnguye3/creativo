import { Card, CardContent } from "@/components/ui/card";
import { Palette, Users, CreditCard, Settings, Zap, Shield, BarChart3, Layers } from "lucide-react";
const Features = () => {
  const features = [{
    icon: Palette,
    title: "AI Design Engine",
    description: "Advanced AI creates stunning designs automatically based on client briefs and brand guidelines."
  }, {
    icon: Users,
    title: "Client Portal",
    description: "White-labeled client dashboard for seamless project management and communication."
  }, {
    icon: CreditCard,
    title: "Billing & Subscriptions",
    description: "Built-in payment processing with flexible subscription models and revenue sharing."
  }, {
    icon: Settings,
    title: "Brand Customization",
    description: "Complete white-label solution with your branding, domain, and custom styling options."
  }, {
    icon: Zap,
    title: "Lightning Fast",
    description: "Generate high-quality designs in seconds with our optimized AI pipeline and infrastructure."
  }, {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level security with SOC 2 compliance, data encryption, and privacy protection."
  }, {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Comprehensive insights into client usage, revenue, performance metrics, and growth trends."
  }, {
    icon: Layers,
    title: "Multi-Service Platform",
    description: "Offer logos, social media ads, presentations, packaging, and more from one platform."
  }];
  return <section className="py-24 bg-gradient-to-b from-blue-50/30 via-purple-50/20 to-background relative overflow-hidden">
      {/* Decorative underlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100/40 via-yellow-50/30 to-orange-200/50"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-amber-100/20 via-transparent to-orange-100/30"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-orange-200/50 shadow-lg">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="block bg-gradient-primary bg-clip-text text-transparent mx-0 py-[20px] my-0">
              Scale Your Agency
            </span>
          </h2>
          <p className="text-xl text-black font-bold">
            Our comprehensive platform provides all the tools and infrastructure 
            needed to launch and grow a successful design agency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => <Card key={index} className="bg-gradient-to-br from-orange-500/95 via-orange-600/90 to-yellow-500/95 border-orange-400/50 hover:border-black/40 transition-all duration-500 hover:shadow-card group relative hover-lift animate-fade-in-up text-black hover:scale-110 hover:z-20 hover:-translate-y-2 hover:rotate-1" style={{
          animationDelay: `${index * 0.15}s`
        }}>
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-black group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="text-black font-bold text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>)}
        </div>
      </div>
    </section>;
};
export default Features;