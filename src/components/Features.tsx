import { useInView } from "@/hooks/useInView";
import { Palette, Users, CreditCard, Settings, Zap, Shield, BarChart3, Layers } from "lucide-react";

const features = [
  { icon: Palette, title: "AI Design Engine", description: "Advanced AI creates stunning designs automatically based on client briefs and brand guidelines." },
  { icon: Users, title: "Client Portal", description: "White-labeled client dashboard for seamless project management and communication." },
  { icon: CreditCard, title: "Billing & Subscriptions", description: "Built-in payment processing with flexible subscription models and revenue sharing." },
  { icon: Settings, title: "Brand Customization", description: "Complete white-label solution with your branding, domain, and custom styling options." },
  { icon: Zap, title: "Lightning Fast", description: "Generate high-quality designs in seconds with our optimized AI pipeline and infrastructure." },
  { icon: Shield, title: "Enterprise Security", description: "Bank-level security with SOC 2 compliance, data encryption, and privacy protection." },
  { icon: BarChart3, title: "Analytics Dashboard", description: "Comprehensive insights into client usage, revenue, performance metrics, and growth trends." },
  { icon: Layers, title: "Multi-Service Platform", description: "Offer logos, social media ads, presentations, packaging, and more from one platform." },
];

const Features = () => {
  const { ref: titleRef, inView: titleVisible } = useInView({ threshold: 0.3 });
  const { ref: gridRef, inView: gridVisible } = useInView({ threshold: 0.05 });

  return (
    <section className="py-24 bg-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-orange-500/3 rounded-full blur-3xl" />
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
            Platform Features
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Scale Your Agency
            </span>
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Our comprehensive platform provides all the tools and infrastructure
            needed to launch and grow a successful design agency.
          </p>
        </div>

        {/* Grid */}
        <div
          ref={gridRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-orange-500/30 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1 cursor-default"
              style={{
                opacity: gridVisible ? 1 : 0,
                transform: gridVisible ? "translateY(0)" : "translateY(28px)",
                transition: `opacity 0.55s ease ${index * 0.07}s, transform 0.55s ease ${index * 0.07}s, border-color 0.3s, background 0.3s, box-shadow 0.3s`,
              }}
            >
              <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/25 group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-orange-300 transition-colors">
                {feature.title}
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
