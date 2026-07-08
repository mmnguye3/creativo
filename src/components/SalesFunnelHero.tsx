import { Button } from "@/components/ui/button";
import { useWhiteLabel } from "@/contexts/WhiteLabelContext";
import { ArrowRight, CheckCircle } from "lucide-react";

const SalesFunnelHero = () => {
  const { agencySettings } = useWhiteLabel();
  
  const agencyName = agencySettings?.agency_name || "Professional Design Studio";
  const heroTitle = agencySettings?.hero_title || "Get Professional Design Work Done in 48 Hours";
  const heroSubtitle = agencySettings?.hero_subtitle || "From logos to websites, we deliver high-quality designs that make your business stand out";

  const scrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative py-20 px-4 bg-gradient-to-br from-white via-orange-50 to-yellow-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto text-center relative z-10 max-w-5xl">
        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-black leading-tight animate-fade-in">
          {heroTitle}
        </h1>
        
        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {heroSubtitle}
        </p>

        {/* Value Props */}
        <div className="flex flex-wrap justify-center gap-6 mb-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-md">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-black">Fast 48h Delivery</span>
          </div>
          <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-md">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-black">Unlimited Revisions</span>
          </div>
          <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-md">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-black">Money-Back Guarantee</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Button 
            size="lg" 
            className="text-xl px-12 py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            onClick={scrollToServices}
          >
            See Our Services & Pricing
            <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
          <p className="text-sm text-gray-600 mt-4">✨ Start your project today - No upfront payment required</p>
        </div>

        {/* Agency Credit */}
        <div className="mt-16 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <p className="text-sm text-gray-500">
            Professional design services by <span className="font-semibold text-black">{agencyName}</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default SalesFunnelHero;