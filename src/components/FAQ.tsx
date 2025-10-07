import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "How do I know which plan is best for me?",
      answer: "You will first want to determine which types of designs you need on a monthly basis which helps you determine which bucket you will fall into. Then, you can choose a price point that fits your budget and volume needs. You can also book a call to speak to a Creativo expert to help determine what plan fits your needs the best."
    },
    {
      question: "Are there any contracts or long-term commitments?",
      answer: "The beauty of our design service is that there are no contracts or commitments to sign in order to work with us. All plans are month-to-month and you can come & go as you please."
    },
    {
      question: "How do you maintain consistency for my brand(s)?",
      answer: "We offer our designers and customers a variety of options inside our platform where branding guidelines can be set up and followed. We can also see 'approved designs' that you were happy with as we work together so any designer can see those for guidance. In addition to these options, we can also make internal notes for our design team based on your feedback and expectations in order to deliver a consistent high-quality design every time."
    },
    {
      question: "How many designs can you work on at once?",
      answer: "This depends on the design plan you are on. Our Starter plans allow us to work on one design at a time, where our larger plans allow us to work on 2, 4, or 6 design requests simultaneously. We also offer custom design plans to cater to large marketing agencies or companies that have a significant need for a high volume of designs."
    },
    {
      question: "Can I upgrade or downgrade any time I choose?",
      answer: "Absolutely! With our flexible Design as a Subscription (DaaS) model, you can upgrade or downgrade whenever you need. Upgrades take effect immediately, while downgrades apply at the start of the next billing cycle. We're built to adapt, whether your design needs grow or slow down."
    },
    {
      question: "What if I'm not satisfied with a design?",
      answer: "We offer unlimited revisions on all our plans. If you're not happy with a design, simply provide feedback through our visual annotation tool and we'll make the necessary changes. We're committed to delivering designs that exceed your expectations."
    },
    {
      question: "How fast can I get my designs?",
      answer: "Most designs are completed within 24-48 hours, depending on complexity. Rush orders can be accommodated for urgent projects. Video editing and more complex projects may take 2-3 business days."
    },
    {
      question: "Do you work with agencies of all sizes?",
      answer: "Yes! We work with solo entrepreneurs, small agencies, and large enterprises. Our white-label platform scales with your business, whether you have 1 client or 100+ clients."
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-teal-50/30 via-cyan-50/20 to-background relative overflow-hidden">
      {/* Decorative underlay */}
      <div className="absolute inset-0 bg-gradient-to-bl from-teal-100/20 via-transparent to-cyan-100/20"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Frequently
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Asked Questions
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Get answers to some of the most commonly asked questions we receive from businesses just like yours.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-gradient-card border border-white/10 rounded-lg px-6 hover:border-primary/20 transition-colors"
              >
                <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary-glow">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;