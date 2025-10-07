import { Button } from "@/components/ui/button";
import { useWhiteLabel } from "@/contexts/WhiteLabelContext";

const WhiteLabelHero = () => {
  const { agencySettings } = useWhiteLabel();

  const heroTitle = agencySettings?.hero_title || "Professional Design Services That Drive Results";
  const heroSubtitle = agencySettings?.hero_subtitle || "Partner with our creative team to build a brand that stands out and converts";
  const agencyName = agencySettings?.agency_name || "Creative Studio";

  return (
    <section className="relative py-20 px-4 bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto text-center text-black">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-black">
          {heroTitle}
        </h1>
        <p className="text-xl md:text-2xl text-black mb-8 max-w-3xl mx-auto">
          {heroSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg px-8" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
            View Our Packages
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>
            Our Services
          </Button>
        </div>
        <p className="text-sm text-black mt-8">
          Powered by {agencyName}
        </p>
      </div>
    </section>
  );
};

export default WhiteLabelHero;