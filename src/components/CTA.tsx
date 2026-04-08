import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const perks = [
  "No long-term contracts",
  "Unlimited revisions",
  "White-label branding",
  "Dedicated support",
];

const CTA = () => {
  return (
    <section className="py-24 bg-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/[0.04] to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Orange gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500" />
            {/* Noise texture */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_50%,white,transparent_70%)]" />
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_80%_20%,white,transparent_60%)]" />

            <div className="relative z-10 p-10 md:p-14 text-center">
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90 mb-6">
                Join 50+ growing agencies
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Ready to Launch Your
                <br />
                Design Agency?
              </h2>

              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                Get access to unlimited design services, a white-label client portal,
                and everything you need to scale — starting today.
              </p>

              {/* Perks */}
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-9">
                {perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-1.5 text-sm text-white/85">
                    <CheckCircle2 className="w-4 h-4 text-white/70" />
                    {perk}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-white/90 border-0 font-semibold px-8 shadow-xl group"
                  asChild
                >
                  <Link to="/contact">
                    Get Started Today
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                  asChild
                >
                  <Link to="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
