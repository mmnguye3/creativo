const items = [
  "Social Media Graphics",
  "Logo & Branding",
  "Motion Graphics",
  "Web Design",
  "Video Editing",
  "Packaging Design",
  "Email Templates",
  "E-commerce Graphics",
  "Custom Illustrations",
  "Print Design",
  "Presentations",
  "Content Creation",
];

const MarqueeTrack = ({ reverse = false }: { reverse?: boolean }) => (
  <div
    className="flex gap-4 shrink-0"
    style={{ animation: `marquee${reverse ? "-reverse" : ""} 35s linear infinite` }}
  >
    {[...items, ...items].map((item, i) => (
      <span
        key={i}
        className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-zinc-400 bg-white/[0.04] border border-white/8 whitespace-nowrap"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
        {item}
      </span>
    ))}
  </div>
);

const Marquee = () => {
  return (
    <div className="relative py-6 bg-zinc-950 overflow-hidden border-y border-white/5">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-zinc-950 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />

      <div className="flex gap-4 overflow-hidden">
        <MarqueeTrack />
        <MarqueeTrack />
      </div>
    </div>
  );
};

export default Marquee;
