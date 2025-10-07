import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star } from "lucide-react";
const Pricing = () => {
  const plans = [{
    name: "Starter",
    price: "$297",
    period: "/month",
    description: "Perfect for launching your first agency",
    features: ["Up to 50 designs/month", "5 client accounts", "Basic white-label branding", "Email support", "Core design templates", "Client portal access"],
    cta: "Start Free Trial",
    popular: false
  }, {
    name: "Professional",
    price: "$597",
    period: "/month",
    description: "Scale your agency with advanced features",
    features: ["Unlimited designs", "25 client accounts", "Full white-label customization", "Priority support", "AI-powered design engine", "Advanced analytics", "Custom domain", "Revenue sharing: 80/20"],
    cta: "Start Growing",
    popular: true
  }, {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large agencies and resellers",
    features: ["Unlimited everything", "Unlimited client accounts", "Custom integrations", "Dedicated account manager", "White-label mobile app", "Custom AI training", "SLA guarantee", "Revenue sharing: 90/10"],
    cta: "Contact Sales",
    popular: false
  }];
  return <section className="py-24 bg-gradient-to-b from-indigo-50/30 via-violet-50/20 to-background relative overflow-hidden">
      {/* Decorative underlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-violet-100/20"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Simple, Transparent
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Choose the perfect plan to launch and scale your AI design agency. 
            All plans include full platform access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => <Card key={index} className={`relative bg-gradient-card border-white/10 hover:border-primary/20 transition-all duration-300 ${plan.popular ? 'ring-2 ring-primary/20 shadow-glow' : ''}`}>
              {plan.popular && <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-primary text-white px-4 py-1 rounded-full text-sm flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-6 my-0">
                <ul className="space-y-3 my-0">
                  {plan.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary-glow flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>)}
                </ul>
                
                <Button variant={plan.popular ? "premium" : "hero"} size="lg" className="\n">
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>)}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            All plans include 14-day free trial • No setup fees • Cancel anytime
          </p>
        </div>
      </div>
    </section>;
};
export default Pricing;