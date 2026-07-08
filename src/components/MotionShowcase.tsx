import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/useInView";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";

// Reuses the Services-page hero clips (public/hero-clips/).
const MOTION_CLIPS = [
  {
    id: 1,
    clip: "/hero-clips/clip-2.mp4",
    poster: "/hero-clips/poster-2.webp",
    posterFallback: "/hero-clips/poster-2.jpg",
    alt: "Dream Home real-estate ad",
    rotation: -2,
    lift: "md:translate-y-6",
  },
  {
    id: 2,
    clip: "/hero-clips/clip-1.mp4",
    poster: "/hero-clips/poster-1.webp",
    posterFallback: "/hero-clips/poster-1.jpg",
    alt: "Skincare serum social media post",
    rotation: 2,
    lift: "md:-translate-y-3",
  },
  {
    id: 3,
    clip: "/hero-clips/clip-4.mp4",
    poster: "/hero-clips/poster-4.webp",
    posterFallback: "/hero-clips/poster-4.jpg",
    alt: "Product lifestyle photography design",
    rotation: -1.5,
    lift: "md:translate-y-4",
  },
  {
    id: 4,
    clip: "/hero-clips/clip-3.mp4",
    poster: "/hero-clips/poster-3.webp",
    posterFallback: "/hero-clips/poster-3.jpg",
    alt: "Podcast episodes social content",
    rotation: 2.5,
    lift: "md:-translate-y-5",
  },
  {
    id: 5,
    clip: "/hero-clips/clip-5.mp4",
    poster: "/hero-clips/poster-5.webp",
    posterFallback: "/hero-clips/poster-5.jpg",
    alt: "Brand strategy marketing design",
    rotation: -2.5,
    lift: "md:translate-y-2",
  },
] as const;

const MotionShowcase = () => {
  const { ref: titleRef, inView: titleVisible } = useInView({ threshold: 0.3 });
  const { ref: stripRef, inView: stripVisible } = useInView({ threshold: 0.1 });
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Play clips only while the strip is on screen (saves battery / data)
  useEffect(() => {
    if (isMobile) return;
    const container = containerRef.current;
    if (!container) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        const vids = Object.values(videoRefs.current).filter(Boolean) as HTMLVideoElement[];
        if (entry.isIntersecting) {
          vids.forEach((v) => { v.play().catch(() => {}); });
        } else {
          vids.forEach((v) => v.pause());
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(container);
    return () => obs.disconnect();
  }, [isMobile]);

  return (
    <section id="motion-showcase" className="py-24 bg-zinc-950 relative overflow-hidden" data-testid="section-motion-showcase">
      {/* Ambient glow + rules */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="absolute top-24 right-[10%] w-[500px] h-[300px] bg-orange-500/6 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Heading */}
        <div
          ref={titleRef as React.RefObject<HTMLDivElement>}
          className="text-center max-w-2xl mx-auto mb-14"
          style={{
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-sm text-orange-400 mb-5">
            <Play className="w-3.5 h-3.5" />
            Work in Motion
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Creatives that{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              move
            </span>
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Scroll-stopping video ads, animated posts, and motion graphics — produced
            for your clients under your agency's brand.
          </p>
        </div>

        {/* Video strip */}
        <div
          ref={(el) => {
            containerRef.current = el;
            (stripRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5 max-w-6xl mx-auto"
          style={{
            opacity: stripVisible ? 1 : 0,
            transform: stripVisible ? "translateY(0)" : "translateY(28px)",
            transition: "opacity 0.75s ease 0.1s, transform 0.75s ease 0.1s",
          }}
        >
          <style>{`
            .motion-clip-card { transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; }
            .motion-clip-card:hover { transform: translateY(-6px) rotate(0deg) !important; box-shadow: 0 24px 48px rgba(0,0,0,0.55); border-color: rgba(249,115,22,0.4); }
          `}</style>
          {MOTION_CLIPS.map((card, i) => (
            <div
              key={card.id}
              className={`motion-clip-card rounded-2xl overflow-hidden border border-white/10 ${card.lift} ${i === 4 ? "col-span-2 md:col-span-1 max-w-[calc(50%-0.5rem)] md:max-w-none mx-auto md:mx-0 w-full" : ""}`}
              style={{
                transform: `rotate(${card.rotation}deg)`,
                boxShadow: "0 14px 36px rgba(0,0,0,0.45)",
              }}
              data-testid={`card-motion-clip-${card.id}`}
            >
              {isMobile ? (
                <picture>
                  <source srcSet={card.poster} type="image/webp" />
                  <img
                    src={card.posterFallback}
                    alt={card.alt}
                    loading="lazy"
                    decoding="async"
                    style={{ display: "block", width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover" }}
                  />
                </picture>
              ) : (
                <video
                  ref={(el) => { videoRefs.current[card.id] = el; }}
                  src={card.clip}
                  poster={card.poster}
                  muted
                  loop
                  playsInline
                  preload="none"
                  aria-label={card.alt}
                  style={{ display: "block", width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover" }}
                  onError={(e) => {
                    const v = e.currentTarget;
                    if (v.src && !v.src.endsWith(".webp")) {
                      v.removeAttribute("src");
                      v.load();
                    }
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/services">
            <Button
              variant="outline"
              className="border-zinc-700 bg-transparent text-white hover:bg-white/5 hover:border-orange-500/50 rounded-xl px-6 h-11 font-semibold"
              data-testid="button-motion-see-services"
            >
              Explore Video Services
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default MotionShowcase;
