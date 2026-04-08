import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ArrowRight, Sparkles, Users, Palette, Zap, CheckCircle2,
  TrendingUp, Star, Clock
} from "lucide-react";
import { useCountUp, useInView } from "@/hooks/useInView";

const FloatingCard = ({
  className,
  delay = 0,
  children,
}: {
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) => (
  <div
    className={`absolute hidden lg:flex items-center gap-3 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl shadow-black/40 ${className}`}
    style={{ animation: `float-card 6s ease-in-out infinite`, animationDelay: `${delay}s` }}
  >
    {children}
  </div>
);

const Stat = ({
  target,
  suffix = "",
  label,
  icon: Icon,
  started,
}: {
  target: number;
  suffix?: string;
  label: string;
  icon: React.ElementType;
  started: boolean;
}) => {
  const value = useCountUp(target, 1800, started);
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <Icon className="w-4 h-4 text-orange-400" />
        <span className="text-2xl font-bold text-white">
          {value}{suffix}
        </span>
      </div>
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  );
};

const Hero = () => {
  const { ref: statsRef, inView: statsVisible } = useInView({ threshold: 0.3 });
  const [typedIndex, setTypedIndex] = useState(0);
  const words = ["Minutes", "Hours", "A Day"];
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayed, setDisplayed] = useState("Minutes");

  useEffect(() => {
    const target = words[wordIndex];
    const speed = isDeleting ? 60 : 110;
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayed.length < target.length) {
          setDisplayed(target.slice(0, displayed.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 1600);
        }
      } else {
        if (displayed.length > 0) {
          setDisplayed(displayed.slice(0, -1));
        } else {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, speed);
    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, wordIndex]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-zinc-950">
      {/* Animated radial glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-orange-500/6 blur-[120px] animate-breathe" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-500/4 blur-3xl animate-breathe-slow" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-orange-600/4 blur-3xl animate-breathe" style={{ animationDelay: "2s" }} />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* Dot particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-orange-500/30"
            style={{
              left: `${10 + ((i * 37) % 82)}%`,
              top: `${5 + ((i * 53) % 88)}%`,
              animation: `particle-float ${4 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.4) % 4}s`,
            }}
          />
        ))}
      </div>

      {/* Floating UI cards */}
      <FloatingCard className="top-32 left-12 xl:left-24" delay={0}>
        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <p className="text-xs text-zinc-500">Revenue</p>
          <p className="text-sm font-bold text-white">+247%</p>
        </div>
      </FloatingCard>

      <FloatingCard className="top-48 right-12 xl:right-28" delay={1.5}>
        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
          <Star className="w-4 h-4 text-orange-400" />
        </div>
        <div>
          <p className="text-xs text-zinc-500">Client Rating</p>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>
      </FloatingCard>

      <FloatingCard className="bottom-40 left-14 xl:left-28" delay={3}>
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <p className="text-xs text-zinc-500">Orders Completed</p>
          <p className="text-sm font-bold text-white">10,482</p>
        </div>
      </FloatingCard>

      <FloatingCard className="bottom-56 right-10 xl:right-24" delay={2}>
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <p className="text-xs text-zinc-500">Avg. Delivery</p>
          <p className="text-sm font-bold text-white">48 hrs</p>
        </div>
      </FloatingCard>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 text-center pt-24 pb-16">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 rounded-full px-4 py-1.5 text-sm text-orange-400 mb-8 animate-fade-up">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
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
          in{" "}
          <span className="relative">
            <span className="text-white">{displayed}</span>
            <span className="animate-blink text-orange-400">|</span>
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          Complete white-label platform with unlimited design services,
          client management, and subscription billing — ready to brand as your own.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <Button
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-xl shadow-orange-500/30 px-8 h-12 text-base font-semibold group relative overflow-hidden"
            asChild
          >
            <Link to="/contact">
              <span className="relative z-10 flex items-center gap-2">
                Start Your Agency
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="absolute inset-0 bg-white/10 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 skew-x-12" />
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
          ref={statsRef as React.RefObject<HTMLDivElement>}
          className="mt-20 grid grid-cols-3 gap-8 max-w-xl mx-auto border-t border-white/5 pt-12 animate-fade-up"
          style={{ animationDelay: "0.45s" }}
        >
          <Stat target={500} suffix="+" label="Clients" icon={Users} started={statsVisible} />
          <Stat target={10000} suffix="+" label="Designs Created" icon={Palette} started={statsVisible} />
          <Stat target={99} suffix=".9%" label="Uptime" icon={Zap} started={statsVisible} />
        </div>
      </div>
    </section>
  );
};

export default Hero;
