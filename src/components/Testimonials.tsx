import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
const Testimonials = () => {
  const testimonials = [{
    name: "Sarah Johnson",
    company: "Digital Marketing Pro",
    role: "Agency Owner",
    content: "Creativo has transformed our agency. We went from struggling to deliver designs on time to having a reliable partner that never misses a deadline. Our clients are amazed by the quality.",
    rating: 5,
    avatar: "/placeholder-avatar1.jpg"
  }, {
    name: "Michael Chen",
    company: "E-commerce Solutions",
    role: "Marketing Director",
    content: "The white-label platform is exactly what we needed. Our clients think we have an in-house design team of 20 people. The ROI has been incredible - we've 5x'd our design revenue.",
    rating: 5,
    avatar: "/placeholder-avatar2.jpg"
  }, {
    name: "Jessica Williams",
    company: "Growth Agency Co",
    role: "Creative Director",
    content: "I was skeptical about outsourcing design work, but Creativo proved me wrong. The consistency and quality are better than most freelancers, and the turnaround time is unmatched.",
    rating: 5,
    avatar: "/placeholder-avatar3.jpg"
  }, {
    name: "David Rodriguez",
    company: "Brand Builder Inc",
    role: "CEO",
    content: "We've been able to scale our agency from 5 to 50 clients without hiring additional designers. The platform handles everything seamlessly and our profit margins have never been better.",
    rating: 5,
    avatar: "/placeholder-avatar4.jpg"
  }, {
    name: "Amanda Foster",
    company: "Creative Collective",
    role: "Project Manager",
    content: "The feedback system is incredible. I can annotate designs directly and get revisions back in hours, not days. It's completely changed how we work with our clients.",
    rating: 5,
    avatar: "/placeholder-avatar5.jpg"
  }, {
    name: "Robert Kim",
    company: "Digital Growth Hub",
    role: "Founder",
    content: "From social media ads to complete rebrands, Creativo handles it all. The unlimited revisions give us confidence to push for perfection with every project.",
    rating: 5,
    avatar: "/placeholder-avatar6.jpg"
  }];
  return <section className="bg-gradient-to-b from-pink-50/30 via-rose-50/20 to-background relative overflow-hidden py-24">
      {/* Decorative underlay */}
      <div className="absolute inset-0 bg-black"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Hear From Business Owners
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Just Like You
            </span>
          </h2>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />)}
            </div>
            <span className="text-xl font-semibold text-white">Excellent</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => <Card key={index} className="bg-gradient-card border-white/10 hover:border-primary/20 transition-all duration-300 hover:shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Quote className="w-5 h-5 text-primary-glow" />
                  <div className="flex">
                    {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                </div>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>
      </div>
    </section>;
};
export default Testimonials;