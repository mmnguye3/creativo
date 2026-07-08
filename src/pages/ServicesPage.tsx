import { useState, useEffect, useRef } from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Palette, 
  Video, 
  FileImage,
  Monitor,
  Package,
  Mail,
  ShoppingBag,
  Printer,
  Presentation,
  Layers,
  Brush,
  Play,
  Megaphone,
  TrendingUp,
  Zap,
  Globe,
  Check,
  ArrowRight,
  Camera,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Twitter,
  Image,
  Mic,
  Edit,
  Sparkles,
  Gift,
  PenTool,
  FileText,
  BookOpen,
  Shirt,
  Car
} from "lucide-react";
import digitalAdsIcon from "@/assets/icons/digital-ads.png";
import socialMediaIcon from "@/assets/icons/social-media-content.png";
import videoContentIcon from "@/assets/icons/video-content.png";
import ecommerceIcon from "@/assets/icons/ecommerce-content.png";

// ── Hero video / poster cards ─────────────────────────────────────────────────
// Drop MP4 clips into public/hero-clips/ as clip-1.mp4 … clip-5.mp4.
// Until a clip file exists the card shows its poster image (identical to the
// static-picture version). The poster WebP files are already there.
const HERO_CLIPS = [
  {
    id: 1,
    clip: '/hero-clips/clip-1.mp4',
    poster: '/hero-clips/poster-1.webp',
    posterFallback: '/hero-clips/poster-1.jpg',
    alt: 'Skincare serum social media post',
    rotation: -3,
    duration: 4.2,
    delay: 0,
    ratio: '1 / 1',
    pos: { top: '29%', left: '33%', width: '34%' },
  },
  {
    id: 2,
    clip: '/hero-clips/clip-2.mp4',
    poster: '/hero-clips/poster-2.webp',
    posterFallback: '/hero-clips/poster-2.jpg',
    alt: 'Dream Home real-estate ad',
    rotation: -8,
    duration: 5.1,
    delay: 0.7,
    ratio: '1 / 1',
    pos: { top: '3%', left: '0%', width: '30%' },
  },
  {
    id: 3,
    clip: '/hero-clips/clip-3.mp4',
    poster: '/hero-clips/poster-3.webp',
    posterFallback: '/hero-clips/poster-3.jpg',
    alt: 'Podcast episodes social content',
    rotation: 5,
    duration: 4.6,
    delay: 1.4,
    ratio: '1 / 1',
    pos: { bottom: '2%', left: '3%', width: '31%' },
  },
  {
    id: 4,
    clip: '/hero-clips/clip-4.mp4',
    poster: '/hero-clips/poster-4.webp',
    posterFallback: '/hero-clips/poster-4.jpg',
    alt: 'Product lifestyle photography design',
    rotation: 7,
    duration: 3.9,
    delay: 0.3,
    ratio: '1 / 1',
    pos: { top: '3%', right: '2%', width: '31%' },
  },
  {
    id: 5,
    clip: '/hero-clips/clip-5.mp4',
    poster: '/hero-clips/poster-5.webp',
    posterFallback: '/hero-clips/poster-5.jpg',
    alt: 'Brand strategy marketing design',
    rotation: -5,
    duration: 5.3,
    delay: 1.1,
    ratio: '1 / 1',
    pos: { bottom: '2%', right: '3%', width: '30%' },
  },
] as const;

const ServicesPage = () => {
  const [heroVisible, setHeroVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const heroRightRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});

  useEffect(() => { const t = setTimeout(() => setHeroVisible(true), 80); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Play videos when hero is in viewport; pause when scrolled away (saves battery)
  useEffect(() => {
    if (isMobile) return;
    const container = heroRightRef.current;
    if (!container) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        const vids = Object.values(videoRefs.current).filter(Boolean) as HTMLVideoElement[];
        if (entry.isIntersecting) {
          vids.forEach(v => { v.play().catch(() => {}); });
        } else {
          vids.forEach(v => v.pause());
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(container);
    return () => obs.disconnect();
  }, [isMobile]);

  const serviceCategories = [
    {
      title: "Digital Ads",
      icon: Megaphone,
      iconImage: digitalAdsIcon,
      services: [
        "Graphic Meta Ads",
        "Graphic Tiktok Ads", 
        "Google Display Ads",
        "Graphic Instagram Ads",
        "Graphic Pinterest Ads",
        "Graphic Twitter/X Ads",
        "Graphic LinkedIn Ads",
        "Graphic Carousel Ads",
        "Video Meta Ads <1 min",
        "Video Tiktok Ads <1 min",
        "Video Instagram Ads <1 min",
        "Video Pinterest Ads <1 min",
        "Video LinkedIn Ads <1 min",
        "Youtube Shorts Ads <1 min",
        "Video Twitter/X Ads <1 min"
      ]
    },
    {
      title: "Social Media Content",
      icon: Instagram,
      iconImage: socialMediaIcon,
      services: [
        "Simple GIFs",
        "Social Feed Graphics",
        "Story Graphics",
        "Cover Images",
        "Podcast Cover Art",
        "Meta Banners",
        "Twitch Banners",
        "Twitter/X Banners",
        "YouTube Banners",
        "YouTube Thumbnails",
        "Blog Graphics",
        "Background Removal",
        "Static Design Animations",
        "Icon Animations",
        "Text Overlays <1 min"
      ]
    },
    {
      title: "Video Content",
      icon: Video,
      iconImage: videoContentIcon,
      services: [
        "Captions <1 min",
        "Cinemagraphs",
        "Product Highlights <1 min",
        "Transcriptions <2 min",
        "UGC Mashups <1 min",
        "English AI Voiceover",
        "Video Openers/Titles",
        "Explainer Videos",
        "Lottie Animations",
        "Advanced GIFs",
        "Animated Explainer Video <1 min",
        "Listing Videos <2 mins",
        "Premium AI Voiceover <2 mins"
      ]
    },
    {
      title: "E-commerce Content",
      icon: ShoppingBag,
      iconImage: ecommerceIcon,
      services: [
        "Canva Graphics",
        "Canva Videos",
        "Listing Images",
        "A+/EBC",
        "A+ Premium",
        "Brand Story",
        "Storefront Modules",
        "Product Mockups",
        "Lifestyle Images",
        "Product Infographs",
        "Photo Editing",
        "Listing Videos <5 mins",
        "Product Highlights <5 mins"
      ]
    },
    {
      title: "Email Design",
      icon: Mail,
      services: [
        "Email Template",
        "Email Graphics",
        "Email Signatures",
        "Email Banners",
        "Email Header",
        "Email Footer"
      ]
    },
    {
      title: "Illustrations & Graphics",
      icon: Brush,
      services: [
        "Website Banner",
        "Icons",
        "Characters",
        "Mascots",
        "Flat Illustrations",
        "Charts/Graphs",
        "Animated Logos"
      ]
    },
    {
      title: "Packaging & Branding",
      icon: Package,
      services: [
        "Package Design",
        "Packaging Insert",
        "Labels",
        "Logo Design",
        "Brand Style Guide",
        "Brand Colors",
        "Patterns",
        "Vector Tracing"
      ]
    },
    {
      title: "Print Design",
      icon: Printer,
      services: [
        "Business Cards",
        "Banners",
        "Catalog Design <5 pages",
        "Flyer Design",
        "Brochure Design",
        "Poster Design",
        "Signage Design",
        "Album Covers",
        "Book Covers",
        "Postcards",
        "Certificates/Awards",
        "Menu Design",
        "Stationary",
        "Invitations",
        "Trade Show Banners",
        "T-Shirts",
        "Billboard Design",
        "Stickers"
      ]
    },
    {
      title: "Presentations & Documents",
      icon: Presentation,
      services: [
        "Slide Deck Design <10 slides",
        "Slide Deck Templates",
        "Slide Deck Graphics",
        "Infographics",
        "Newsletters",
        "Sales Sheets",
        "eBook Cover",
        "Pitch Deck",
        "PDF <10 Pages",
        "Slide Deck Design <20 slides",
        "PDF <20 Pages"
      ]
    },
    {
      title: "Long Form Video",
      icon: Camera,
      services: [
        "Meta Ads <3 mins",
        "Tiktok Ads <3 mins",
        "Instagram Ads <3 mins",
        "Pinterest Ads <3 mins",
        "LinkedIn Ads <3 mins",
        "Youtube Shorts Ads <3 mins",
        "Twitter/X Ads <3 mins",
        "Text Overlays <3 mins",
        "Captions <5 mins",
        "Custom Captions <3 mins",
        "Simple Character Animations",
        "Standard Long Form Edit <5 mins",
        "Event Promos <3 mins",
        "B-roll Explainer Video <3 mins",
        "Sizzle Reel <1 min",
        "Standard Long Form Edit <10 mins",
        "Event Promos <5 mins",
        "B-roll Explainer Video <5 mins",
        "Condensing Long Videos",
        "Video Sales Letter",
        "Sizzle Reel <3 mins",
        "Pro Long Form Edit",
        "UGC Mashups <5 mins",
        "Captions <10 mins"
      ]
    },
    {
      title: "Web Design",
      icon: Monitor,
      services: [
        "Page Section",
        "Landing Page",
        "Website Graphics",
        "Website Design",
        "Wireframe",
        "Simple UI Kit",
        "Simple APP UI Design",
        "Figma Prototype",
        "Vehicle Wraps"
      ]
    }
  ];

  const designPlans = [
    {
      icon: Megaphone,
      iconImage: digitalAdsIcon,
      title: "Digital Ads",
      description: "Get all your social media graphic and video ads delivered on time, every single time, like a well-oiled machine."
    },
    {
      icon: TrendingUp,
      title: "Ecom",
      description: "Get all the graphic & video creatives you need to run a successful e-commerce brand and drive more sales."
    },
    {
      icon: Zap,
      title: "Marketing",
      description: "Scale your agency with stunning designs for every single one of your brands without increasing your overhead."
    },
    {
      icon: Globe,
      title: "Full Stack",
      description: "Build and launch websites or take advantage of all the other design types we have to offer with unlimited revisions included."
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-orange-500/5 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — copy */}
            <div>
              <p className="text-orange-400 text-xs font-bold tracking-[0.18em] uppercase mb-4"
                style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity 0.55s ease 0s, transform 0.55s ease 0s' }}>
                Services
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.08] mb-5"
                style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.6s ease 0.08s, transform 0.6s ease 0.08s' }}>
                Every design your clients{' '}
                <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  will ever ask for
                </span>
              </h1>
              <p className="text-zinc-400 text-lg leading-relaxed mb-8 max-w-lg"
                style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity 0.6s ease 0.17s, transform 0.6s ease 0.17s' }}>
                Twelve design verticals — social, brand, web, video, print — delivered under your agency's name in as little as 24 hours.
              </p>
              <div className="flex flex-wrap gap-3 mb-8"
                style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.6s ease 0.26s, transform 0.6s ease 0.26s' }}>
                <Button
                  onClick={() => document.getElementById('services-grid')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-6 h-11 shadow-lg shadow-orange-500/25"
                >
                  Browse Services
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5"
                style={{ opacity: heroVisible ? 1 : 0, transition: 'opacity 0.6s ease 0.36s' }}>
                {[
                  { num: '48k+', label: 'designs delivered' },
                  { num: '24hr', label: 'avg turnaround' },
                  { num: '4.9★', label: 'vendor rating' },
                ].map(({ num, label }, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-sm">
                    {i > 0 && <span className="text-zinc-700 mr-1 hidden sm:inline">·</span>}
                    <span className="text-white font-bold">{num}</span>
                    <span className="text-zinc-500">{label}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Right — Floating video / poster cards */}
            {/* ── Desktop: scattered absolute layout ─────────────────── */}
            <div
              ref={heroRightRef}
              className="hidden lg:block relative h-[500px] w-full"
              style={{
                opacity: heroVisible ? 1 : 0,
                transition: 'opacity 0.75s ease 0.15s',
              }}
              aria-hidden="true"
            >
              <style>{`
                @keyframes hfloat-1{0%,100%{transform:translateY(0px) rotate(-3deg)}50%{transform:translateY(-7px) rotate(-3deg)}}
                @keyframes hfloat-2{0%,100%{transform:translateY(0px) rotate(-8deg)}50%{transform:translateY(-5px) rotate(-8deg)}}
                @keyframes hfloat-3{0%,100%{transform:translateY(0px) rotate(5deg)} 50%{transform:translateY(-8px) rotate(5deg)}}
                @keyframes hfloat-4{0%,100%{transform:translateY(0px) rotate(7deg)} 50%{transform:translateY(-6px) rotate(7deg)}}
                @keyframes hfloat-5{0%,100%{transform:translateY(0px) rotate(-5deg)}50%{transform:translateY(-9px) rotate(-5deg)}}
                .hero-vid-card{transition:box-shadow 0.25s ease,filter 0.25s ease}
                .hero-vid-card:hover{box-shadow:0 28px 56px rgba(0,0,0,0.55)!important;filter:brightness(1.06)}
              `}</style>

              {HERO_CLIPS.map((card) => (
                <div
                  key={card.id}
                  className="absolute hero-vid-card"
                  style={{
                    ...card.pos,
                    animation: `hfloat-${card.id} ${card.duration}s ease-in-out ${card.delay}s infinite`,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    zIndex: card.id === 1 ? 3 : card.id === 4 ? 4 : 2,
                  }}
                >
                  {/* Video element — shows poster until clip file is uploaded */}
                  <video
                    ref={(el) => { videoRefs.current[card.id] = el; }}
                    src={card.clip}
                    poster={card.poster}
                    muted
                    loop
                    playsInline
                    preload="none"
                    aria-label={card.alt}
                    style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: card.ratio, objectFit: 'cover' }}
                    onError={(e) => {
                      // If clip is missing, hide the broken-video icon by clearing src
                      const v = e.currentTarget;
                      if (v.src && !v.src.endsWith('.webp')) {
                        v.removeAttribute('src');
                        v.load();
                      }
                    }}
                  />
                </div>
              ))}
            </div>

            {/* ── Mobile: 2×2 poster grid (no video — saves data) ─────── */}
            <div className="grid grid-cols-2 gap-3 lg:hidden" aria-hidden="true"
              style={{ opacity: heroVisible ? 1 : 0, transition: 'opacity 0.75s ease 0.15s' }}>
              {HERO_CLIPS.slice(0, 4).map((card) => (
                <div key={card.id}
                  style={{
                    borderRadius: '14px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    transform: `rotate(${card.rotation * 0.3}deg)`,
                  }}>
                  <picture>
                    <source srcSet={card.poster} type="image/webp" />
                    <img src={card.posterFallback} alt={card.alt} loading="lazy" decoding="async"
                      style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '1 / 1', objectFit: 'cover' }} />
                  </picture>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* All Services Section */}
      <section id="services-grid" className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              All <span className="bg-gradient-primary bg-clip-text text-transparent">Services</span>
            </h2>
            <p className="text-xl text-white">
              Complete list of our design services organized by category.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {serviceCategories.map((category, categoryIndex) => (
              <Card 
                key={categoryIndex} 
                className="bg-gradient-card border-white/10 hover:border-primary/20 transition-all duration-300 hover:shadow-card hover-lift animate-fade-in-up"
                style={{ animationDelay: `${categoryIndex * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    {'iconImage' in category && category.iconImage ? (
                      <img src={category.iconImage} alt="" aria-hidden="true" className="w-12 h-12 object-contain" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <category.icon className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(category.services || []).map((service, serviceIndex) => (
                      <div key={serviceIndex} className="flex items-center gap-2 py-1">
                        <Check className="w-4 h-4 text-primary-glow flex-shrink-0" />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Design Plans Section */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Design <span className="bg-gradient-primary bg-clip-text text-transparent">Plans</span>
            </h2>
            <p className="text-xl text-white">
              Comprehensive design solutions tailored to your specific business needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {designPlans.map((plan, index) => (
              <Card key={index} className="bg-gradient-card border-white/10 hover:border-primary/20 transition-all duration-300 hover:shadow-card hover-lift">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    {'iconImage' in plan && plan.iconImage ? (
                      <img src={plan.iconImage} alt="" aria-hidden="true" className="w-12 h-12 object-contain" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <plan.icon className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <CardTitle className="text-xl">{plan.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base leading-relaxed">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="hero" size="lg" className="w-full group">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-background/50 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your 
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                Business?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of businesses that trust us with their design needs. 
              Get started today and see the difference professional design can make.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" asChild>
                <Link to="/contact">Get Started Today</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;