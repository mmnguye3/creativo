import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Users, Zap, Target } from "lucide-react";
const CTA = () => {
  return <section className="py-24 bg-gradient-to-b from-purple-50/30 via-blue-50/20 to-background relative overflow-hidden">
      {/* Decorative underlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/80 to-purple-600"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-card border border-white/10 rounded-3xl p-12 relative overflow-hidden">
            {/* Floating elements with icons */}
            <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-glass rounded-full animate-float opacity-20 flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary-glow/60 animate-bounce-subtle" />
            </div>
            <div className="absolute bottom-6 left-6 w-16 h-16 bg-gradient-glass rounded-full animate-float opacity-15 flex items-center justify-center" style={{
            animationDelay: '-2s'
          }}>
              <Target className="w-6 h-6 text-primary-glow/60" />
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-gradient-glass border border-white/20 rounded-full px-4 py-2 text-sm mb-6 backdrop-blur-md">
                <Users className="w-4 h-4 text-primary-glow" />
                <span>Join Over 50+ agencies! </span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to
                <span className="block bg-gradient-primary bg-clip-text text-transparent">
                  Transform Your Vision Into Reality?
                </span>
              </h2>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Let's create something extraordinary together! Become the next success story and scale your brand to new heights with unlimited designs.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button variant="hero" size="xl" className="group" asChild>
                  <Link to="/contact">
                    Get Started Today
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default CTA;