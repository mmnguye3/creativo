import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Users, Palette, Zap } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-zinc-950">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-orange-500/5 blur-3xl" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-500/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-orange-600/4 blur-3xl" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 text-center pt-24 pb-16">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-sm text-orange-400 mb-8 animate-fade-up">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered White Label Platform
        </div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight text-white mb-6 animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          Launch Your
          <br />
          <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">
            Design Agency
          </span>
          <br />
          in Minutes
        </h1>

        {/* Subheadline */}
        <p
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          Complete white-label platform with unlimited design services,
          client management, and subscription billing — ready to brand as your own.
        </p>

        {/* CTA */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <Button
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-xl shadow-orange-500/30 px-8 h-12 text-base font-semibold group"
            asChild
          >
            <Link to="/contact">
              Start Your Agency
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-white/5 h-12 px-8 text-base"
            asChild
          >
            <Link to="/services">See Our Services</Link>
          </Button>
        </div>

        {/* Stats */}
        <div
          className="mt-20 grid grid-cols-3 gap-8 max-w-xl mx-auto border-t border-white/5 pt-12 animate-fade-up"
          style={{ animationDelay: "0.45s" }}
        >
          {[
            { icon: Users, value: "500+", label: "Clients" },
            { icon: Palette, value: "10K+", label: "Designs Created" },
            { icon: Zap, value: "99.9%", label: "Uptime" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Icon className="w-4 h-4 text-orange-400" />
                <span className="text-2xl font-bold text-white">{value}</span>
              </div>
              <p className="text-sm text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
