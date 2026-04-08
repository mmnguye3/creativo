import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, TrendingUp, Clock, Target, Bot, BarChart3, Sparkles, ArrowRight } from "lucide-react";
import { useInView, useCountUp } from "@/hooks/useInView";

const CountStat = ({
  value,
  label,
  started,
}: {
  value: string;
  label: string;
  started: boolean;
}) => {
  const numericPart = parseInt(value.replace(/\D/g, ""), 10) || 0;
  const suffix = value.replace(/[0-9]/g, "");
  const counted = useCountUp(numericPart, 1600, started);

  return (
    <div className="text-center p-5 rounded-xl bg-white/[0.03] border border-white/8 hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-0.5 group">
      <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent group-hover:from-orange-300 group-hover:to-amber-300 transition-all">
        {numericPart > 0 ? counted : value}
        {numericPart > 0 ? suffix : ""}
      </div>
      <div className="text-xs text-zinc-500 mt-1 font-medium tracking-wide uppercase">{label}</div>
    </div>
  );
};

const capabilities = [
  { icon: Bot, title: "AI-Powered Creative", description: "Our AI generates stunning ad creatives, copy, and visuals in seconds — not days." },
  { icon: Target, title: "Smart Audience Targeting", description: "Machine learning identifies your ideal customers and optimizes campaigns in real-time." },
  { icon: BarChart3, title: "Predictive Analytics", description: "Know what works before you spend. AI forecasts performance and allocates budget intelligently." },
  { icon: Clock, title: "Instant Iteration", description: "A/B test hundreds of variations simultaneously. Find winners faster than any human team." },
  { icon: TrendingUp, title: "Self-Optimizing Campaigns", description: "Campaigns that learn and improve automatically — getting better results every single day." },
  { icon: Sparkles, title: "White-Label Ready", description: "Offer AI-powered ad services under your own brand. Scale without hiring." },
];

const stats = [
  { value: "10x", label: "Faster Delivery" },
  { value: "60%", label: "Cost Savings" },
  { value: "24/7", label: "Always On" },
  { value: "500+", label: "Brands Served" },
];

const AIAdAgency = () => {
  const { ref: statsRef, inView: statsVisible } = useInView({ threshold: 0.3 });
  const { ref: cardsRef, inView: cardsVisible } = useInView({ threshold: 0.1 });

  return (
    <section className="py-24 relative bg-zinc-950 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-amber-500/4 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-sm text-orange-400">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            The Future of Advertising is Here
          </div>
        </div>

        {/* Heading */}
        <div className="text-center max-w-4xl mx-auto mb-14">
          <h2 className="text-4xl md:text-6xl font-bold mb-5 leading-tight text-white">
            Your Entire Ad Agency,{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Powered by AI
            </span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Stop paying agency retainers. Our AI creates, launches, and optimizes
            ad campaigns across every platform — delivering better results at a fraction of the cost.
          </p>
        </div>

        {/* Animated stats bar */}
        <div
          ref={statsRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-16"
        >
          {stats.map((stat) => (
            <CountStat key={stat.value} value={stat.value} label={stat.label} started={statsVisible} />
          ))}
        </div>

        {/* Capabilities grid with stagger reveal */}
        <div
          ref={cardsRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14"
        >
          {capabilities.map((cap, i) => (
            <div
              key={cap.title}
              className="group p-6 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-orange-500/25 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1"
              style={{
                opacity: cardsVisible ? 1 : 0,
                transform: cardsVisible ? "translateY(0)" : "translateY(24px)",
                transition: `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`,
              }}
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/20">
                <cap.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-semibold mb-2 text-white group-hover:text-orange-300 transition-colors">
                {cap.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{cap.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4 items-center">
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/25 px-8 group relative overflow-hidden"
              asChild
            >
              <Link to="/pricing">
                <span className="relative z-10 flex items-center gap-2">
                  Start Automating Today
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute inset-0 bg-white/10 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 skew-x-12" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-white/5"
              asChild
            >
              <Link to="/services">See How It Works</Link>
            </Button>
          </div>
          <p className="text-sm text-zinc-600 mt-4">No contracts. Cancel anytime. Results guaranteed.</p>
        </div>
      </div>
    </section>
  );
};

export default AIAdAgency;
