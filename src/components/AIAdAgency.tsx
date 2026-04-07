import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Zap, 
  TrendingUp, 
  Clock, 
  Target, 
  Bot, 
  BarChart3,
  Sparkles,
  ArrowRight
} from "lucide-react";

const AIAdAgency = () => {
  const stats = [
    { value: "10x", label: "Faster Delivery" },
    { value: "60%", label: "Cost Savings" },
    { value: "24/7", label: "Always On" },
    { value: "500+", label: "Brands Served" },
  ];

  const capabilities = [
    {
      icon: Bot,
      title: "AI-Powered Creative",
      description: "Our AI generates stunning ad creatives, copy, and visuals in seconds — not days.",
    },
    {
      icon: Target,
      title: "Smart Audience Targeting",
      description: "Machine learning identifies your ideal customers and optimizes campaigns in real-time.",
    },
    {
      icon: BarChart3,
      title: "Predictive Analytics",
      description: "Know what works before you spend. AI forecasts performance and allocates budget intelligently.",
    },
    {
      icon: Clock,
      title: "Instant Iteration",
      description: "A/B test hundreds of variations simultaneously. Find winners faster than any human team.",
    },
    {
      icon: TrendingUp,
      title: "Self-Optimizing Campaigns",
      description: "Campaigns that learn and improve automatically — getting better results every single day.",
    },
    {
      icon: Sparkles,
      title: "White-Label Ready",
      description: "Offer AI-powered ad services under your own brand. Scale without hiring.",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-background via-foreground/[0.03] to-background">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm font-medium text-primary">
            <Zap className="w-4 h-4" />
            The Future of Advertising is Here
          </div>
        </div>

        {/* Heading */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Your Entire Ad Agency,{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Powered by AI
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop paying agency retainers. Our AI creates, launches, and optimizes 
            ad campaigns across every platform — delivering better results at a 
            fraction of the cost.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-16">
          {stats.map((stat, i) => (
            <div 
              key={i} 
              className="text-center p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Capabilities grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {capabilities.map((cap, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <cap.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                {cap.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {cap.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4 items-center">
            <Button variant="hero" size="lg" asChild className="group">
              <Link to="/pricing">
                Start Automating Today
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/services">See How It Works</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No contracts. Cancel anytime. Results guaranteed.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AIAdAgency;
