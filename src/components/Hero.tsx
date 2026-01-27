import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Users, Palette, TrendingUp, Target, Megaphone, Sparkles, BarChart3, PenTool } from "lucide-react";
// Background image will be loaded from public directory

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image first */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url(/hero-background.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>
      
      {/* Floating elements with agency icons */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-glass rounded-full animate-float opacity-30 flex items-center justify-center">
        <TrendingUp className="w-12 h-12 text-primary-glow/60" />
      </div>
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-glass rounded-full animate-float opacity-20 flex items-center justify-center" style={{ animationDelay: '-2s' }}>
        <Target className="w-8 h-8 text-primary-glow/60" />
      </div>
      <div className="absolute top-1/2 left-10 w-16 h-16 bg-gradient-glass rounded-full animate-float opacity-25 flex items-center justify-center" style={{ animationDelay: '-4s' }}>
        <Megaphone className="w-6 h-6 text-primary-glow/60" />
      </div>
      
      {/* Additional floating icons */}
      <div className="absolute top-1/3 right-32 w-20 h-20 bg-gradient-glass rounded-full animate-float opacity-20 flex items-center justify-center" style={{ animationDelay: '-1s' }}>
        <BarChart3 className="w-7 h-7 text-primary-glow/60" />
      </div>
      <div className="absolute bottom-1/3 left-32 w-14 h-14 bg-gradient-glass rounded-full animate-float opacity-30 flex items-center justify-center" style={{ animationDelay: '-3s' }}>
        <PenTool className="w-5 h-5 text-primary-glow/60" />
      </div>
      <div className="absolute top-3/4 right-1/4 w-18 h-18 bg-gradient-glass rounded-full animate-float opacity-25 flex items-center justify-center" style={{ animationDelay: '-5s' }}>
        <Sparkles className="w-6 h-6 text-primary-glow/60" />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-8 bg-black/50 backdrop-blur-sm rounded-3xl p-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-glass border border-white/20 rounded-full px-6 py-2 text-sm backdrop-blur-md">
            <Zap className="w-4 h-4 text-primary-glow" />
            <span className="text-white">AI-Powered White Label Solution</span>
          </div>
          
          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight text-white">
            Launch Your
            <span className="block bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent leading-relaxed pb-2">
              Design Agency
            </span>
            in Minutes
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white font-bold max-w-2xl mx-auto leading-relaxed">
            Complete white-label platform with unlimited design services, client management, 
            and subscription billing. Start your design agency today.
          </p>
          
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="hero" 
              size="xl" 
              className="group"
              asChild
            >
              <Link to="/contact">
                Start Your Agency
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/10">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5 text-primary-glow" />
                <span className="text-3xl font-bold text-white">500+</span>
              </div>
              <p className="text-white">Clients</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Palette className="w-5 h-5 text-primary-glow" />
                <span className="text-3xl font-bold text-white">10K+</span>
              </div>
              <p className="text-white">Designs Created</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-primary-glow" />
                <span className="text-3xl font-bold text-white">99.9%</span>
              </div>
              <p className="text-white">Uptime</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;