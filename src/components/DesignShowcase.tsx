import { useInView } from "@/hooks/useInView";

const DesignShowcase = () => {
  const { ref: titleRef, inView: titleVisible } = useInView({ threshold: 0.3 });
  const { ref: imgRef, inView: imgVisible } = useInView({ threshold: 0.1 });

  return (
    <section className="py-24 bg-zinc-950 relative overflow-hidden">
      {/* Subtle top rule */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        {/* Ambient glow behind the image */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-orange-500/6 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Heading block */}
        <div
          ref={titleRef as React.RefObject<HTMLDivElement>}
          className="text-center max-w-2xl mx-auto mb-12"
          style={{
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-sm text-orange-400 mb-5">
            Creative Showcase
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Designs your clients{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              will love
            </span>
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Ready-to-order social media creatives — from real estate ads to brand
            campaigns — delivered fast under your agency label.
          </p>
        </div>

        {/* Collage image */}
        <div
          ref={imgRef as React.RefObject<HTMLDivElement>}
          style={{
            opacity: imgVisible ? 1 : 0,
            transform: imgVisible ? "translateY(0) scale(1)" : "translateY(32px) scale(0.98)",
            transition: "opacity 0.75s ease, transform 0.75s ease",
            transitionDelay: "0.1s",
          }}
        >
          <img
            src="/designs-collage.png"
            alt="Collage of sample social media designs created through Cretivo"
            loading="lazy"
            decoding="async"
            className="w-full max-w-5xl mx-auto block rounded-[20px] border border-white/10 shadow-2xl shadow-black/70"
            style={{ display: "block" }}
          />
        </div>
      </div>
    </section>
  );
};

export default DesignShowcase;
