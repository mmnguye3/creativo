import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Target, 
  Award, 
  Globe,
  ArrowRight,
  Linkedin,
  Twitter,
  Mail
} from "lucide-react";

const About = () => {
  const stats = [
    { icon: Users, value: "500+", label: "Clients" },
    { icon: Globe, value: "50+", label: "Countries Served" },
    { icon: Award, value: "99.9%", label: "Customer Satisfaction" },
    { icon: Target, value: "10K+", label: "Projects Completed" }
  ];

  const team = [
    {
      name: "Alex Chen",
      role: "CEO & Founder",
      bio: "Former design agency owner with 10+ years experience building and scaling creative businesses.",
      image: "👨‍💼"
    },
    {
      name: "Sarah Rodriguez",
      role: "CTO",
      bio: "Tech veteran with expertise in scalable platforms and white-label solutions for creative industries.",
      image: "👩‍💻"
    },
    {
      name: "Mike Johnson",
      role: "Head of Design",
      bio: "Award-winning designer with experience at top agencies, passionate about democratizing great design.",
      image: "🎨"
    },
    {
      name: "Emma Thompson",
      role: "Customer Success",
      bio: "Dedicated to helping agencies succeed with personalized onboarding and ongoing support.",
      image: "🤝"
    }
  ];

  const values = [
    {
      title: "Empowerment",
      description: "We believe every creative professional deserves the tools to build a successful business."
    },
    {
      title: "Quality",
      description: "We're committed to delivering exceptional design and development that exceeds expectations."
    },
    {
      title: "Innovation",
      description: "We continuously evolve our platform with cutting-edge features and industry best practices."
    },
    {
      title: "Partnership",
      description: "Your success is our success. We're not just a vendor – we're your growth partner."
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-hero">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About <span className="bg-gradient-primary bg-clip-text text-transparent">Our Mission</span>
          </h1>
          <p className="text-xl text-white max-w-3xl mx-auto mb-8">
            We're on a mission to democratize design by providing creators and entrepreneurs 
            with the tools they need to build successful design agencies.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold">Skip the Startup Struggle</h3>
                <p className="text-muted-foreground">
                  Starting an advertising agency traditionally means months of building systems, creating processes, 
                  hiring talent, and establishing credibility before you can even think about landing your first client. 
                  What if you could skip all that?
                </p>
                <p className="text-muted-foreground">
                  Our all-in-one platform gives you everything needed to operate a professional ad agency from day one. 
                  Complete with proven systems, professional workflows, and a full team backing you up – so you can 
                  focus on what matters most: acquiring and serving clients.
                </p>
                <p className="text-muted-foreground">
                  Launch your agency today and start generating revenue immediately. No lengthy setup periods, 
                  no hiring headaches, no operational overhead – just a ready-to-go business that scales with your ambitions.
                </p>
              </div>
              
              <Card className="bg-gradient-card border-white/10">
                <CardHeader>
                  <CardTitle>"Why spend months building what already exists? Launch your ad agency today and start serving clients tomorrow."</CardTitle>
                  <CardDescription>- The philosophy behind our platform</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These core values guide every decision we make and shape how we serve our community.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="hover-lift bg-gradient-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                  <CardDescription className="text-base">
                    {value.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Join Our Community?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join hundreds of successful agencies who have transformed their business with our platform.
          </p>
          <Button size="lg" className="group">
            Start Your Journey Today
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default About;