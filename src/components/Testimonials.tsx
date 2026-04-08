import { Star, Quote } from "lucide-react";

const testimonials = [
  { name: "Sarah Johnson", company: "Digital Marketing Pro", role: "Agency Owner", content: "Cretivo has transformed our agency. We went from struggling to deliver designs on time to having a reliable partner that never misses a deadline. Our clients are amazed by the quality.", rating: 5 },
  { name: "Michael Chen", company: "E-commerce Solutions", role: "Marketing Director", content: "The white-label platform is exactly what we needed. Our clients think we have an in-house design team of 20 people. The ROI has been incredible — we've 5x'd our design revenue.", rating: 5 },
  { name: "Jessica Williams", company: "Growth Agency Co", role: "Creative Director", content: "I was skeptical about outsourcing design work, but Cretivo proved me wrong. The consistency and quality are better than most freelancers, and the turnaround time is unmatched.", rating: 5 },
  { name: "David Rodriguez", company: "Brand Builder Inc", role: "CEO", content: "We've been able to scale our agency from 5 to 50 clients without hiring additional designers. The platform handles everything seamlessly and our profit margins have never been better.", rating: 5 },
  { name: "Amanda Foster", company: "Creative Collective", role: "Project Manager", content: "The feedback system is incredible. I can annotate designs directly and get revisions back in hours, not days. It's completely changed how we work with our clients.", rating: 5 },
  { name: "Robert Kim", company: "Digital Growth Hub", role: "Founder", content: "From social media ads to complete rebrands, Cretivo handles it all. The unlimited revisions give us confidence to push for perfection with every project.", rating: 5 },
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-zinc-900/40 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5 text-sm text-yellow-400 mb-5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            Rated Excellent
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Trusted by Agency Owners{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Just Like You
            </span>
          </h2>
          <p className="text-zinc-400 text-lg">
            Join hundreds of agencies who have scaled their design business with Cretivo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-orange-500/20 hover:bg-white/[0.05] transition-all duration-300 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-4">
                <Quote className="w-4 h-4 text-orange-400 shrink-0" />
                <div className="flex">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>

              <p className="text-zinc-400 text-sm leading-relaxed flex-1 mb-5">
                "{t.content}"
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-zinc-500">{t.role} · {t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
