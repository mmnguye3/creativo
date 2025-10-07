import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MessageCircle, Download } from "lucide-react";
const HowItWorks = () => {
  const steps = [{
    icon: FileText,
    number: "01",
    title: "Submit your design request",
    description: "Use our easy-to-follow design brief or our Magical Brief Creator to come up with a clear and concise design brief.",
    image: "/placeholder-step1.jpg"
  }, {
    icon: MessageCircle,
    number: "02",
    title: "Provide feedback on your design",
    description: "Use our visual feedback tool to click and annotate different parts of your design for crystal clear change requests.",
    image: "/placeholder-step2.jpg"
  }, {
    icon: Download,
    number: "03",
    title: "Download & launch your design",
    description: "Download your new design and source files and launch them online for audiences worldwide to see.",
    image: "/placeholder-step3.jpg"
  }];
  return <section className="py-24 bg-gradient-to-b from-green-50/30 via-emerald-50/20 to-background relative overflow-hidden">
      {/* Decorative underlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-green-100/20 via-transparent to-emerald-100/20"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-5xl md:text-5xl font-bold mb-6">
            Getting quality & scalable
            <span className="block bg-gradient-primary bg-clip-text text-transparent my-[5px]">
              creatives has never been easier
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            We'll take your vision and bring it to life while staying consistent with your branding and keeping your goals & objectives in mind.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => <Card key={index} className="bg-gradient-card border-white/10 hover:border-primary/20 transition-all duration-300 group text-center">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-primary-glow mb-2">{step.number}</div>
                </div>
                
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary-glow transition-colors">
                  {step.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>)}
        </div>

        <div className="text-center">
          <Button variant="hero" size="lg">
            Get Started Today
          </Button>
        </div>
      </div>
    </section>;
};
export default HowItWorks;