import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Copy, Download, Sparkles, Lightbulb, RefreshCw, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AIGeneratorProps {
  onGenerationComplete?: () => void;
}

interface ExamplePrompt {
  text: string;
  category: string;
  industry: string;
}

interface ServiceType {
  value: string;
  label: string;
  description: string;
  examples: ExamplePrompt[];
  placeholder: string;
}

const serviceTypes: ServiceType[] = [
  // Design Services
  {
    value: 'social-media-graphics',
    label: 'Social Media Graphics',
    description: 'Create engaging social media posts and graphics for all platforms',
    placeholder: 'Describe your brand, target audience, platform (Instagram, Facebook, Twitter), and design style preferences',
    examples: [
      {
        text: 'Create Instagram post graphics for a fitness brand targeting young adults. Modern, energetic design with bright colors. Include motivational quotes and workout tips.',
        category: 'Instagram Post',
        industry: 'Fitness'
      },
      {
        text: 'Design Facebook cover graphics for a bakery. Warm, inviting style with pastries and baked goods. Include contact information and opening hours.',
        category: 'Facebook Cover',
        industry: 'Food & Beverage'
      }
    ]
  },
  {
    value: 'logo-branding',
    label: 'Logo & Branding',
    description: 'Professional logo design and complete brand identity systems',
    placeholder: 'Describe your business, industry, values, target audience, and preferred style and colors',
    examples: [
      {
        text: 'Design a logo for a sustainable coffee roastery called "Green Bean Co." Focus on eco-friendly values, organic shapes, and earth tones. Modern yet approachable style.',
        category: 'Logo Design',
        industry: 'Food & Beverage'
      },
      {
        text: 'Create a complete brand identity for a tech consulting firm named "Digital Catalyst." Convey innovation, professionalism, and growth. Clean, minimalist design with blue and gray colors.',
        category: 'Brand Identity',
        industry: 'Technology'
      }
    ]
  },
  {
    value: 'print-design',
    label: 'Print Design',
    description: 'Professional print materials for marketing and business needs',
    placeholder: 'Specify the print material type, size requirements, brand guidelines, and intended use',
    examples: [
      {
        text: 'Design a tri-fold brochure for a dental clinic. Professional, clean design with photos of dental procedures. Include services, pricing, and contact information.',
        category: 'Brochure',
        industry: 'Healthcare'
      },
      {
        text: 'Create a poster design for a music festival. Vibrant, energetic design with bold typography. Include lineup, dates, venue, and ticket information.',
        category: 'Poster',
        industry: 'Entertainment'
      }
    ]
  },
  {
    value: 'illustrations',
    label: 'Illustrations',
    description: 'Custom illustrations for websites, marketing materials, and publications',
    placeholder: 'Describe the illustration purpose, style preference, color scheme, and specific elements to include',
    examples: [
      {
        text: 'Create a hero illustration for a productivity app website. Show people collaborating remotely with digital devices. Modern, flat design style with purple and blue colors.',
        category: 'Hero Illustration',
        industry: 'Software'
      },
      {
        text: 'Design character illustrations for a children\'s book about space exploration. Friendly astronaut characters in colorful spacesuits. Cartoon style with bright, engaging colors.',
        category: 'Character Design',
        industry: 'Education'
      }
    ]
  },
  {
    value: 'packaging-design',
    label: 'Packaging Design',
    description: 'Product packaging design for retail and e-commerce',
    placeholder: 'Describe your product, target market, packaging type, size constraints, and brand requirements',
    examples: [
      {
        text: 'Design packaging for organic skincare products. Minimal, eco-friendly design with kraft paper texture. Include ingredient highlights and sustainability messaging.',
        category: 'Product Packaging',
        industry: 'Beauty'
      },
      {
        text: 'Create packaging design for premium chocolate bars. Luxury feel with gold foil accents and elegant typography. Target high-end market.',
        category: 'Food Packaging',
        industry: 'Food & Beverage'
      }
    ]
  },

  // Video Content
  {
    value: 'short-form-video',
    label: 'Short Form Video Editing',
    description: 'Editing concepts for TikTok, Instagram Reels, and YouTube Shorts',
    placeholder: 'Describe your video content, style preferences, target audience, and key messages',
    examples: [
      {
        text: 'Create editing concept for a 30-second product demo video for TikTok. Fast-paced cuts, trending music, text overlays. Target Gen Z audience for a tech gadget.',
        category: 'Product Demo',
        industry: 'Technology'
      },
      {
        text: 'Design editing plan for Instagram Reels showcasing before/after transformations for a home renovation company. Dynamic transitions and engaging text animations.',
        category: 'Before/After',
        industry: 'Home Improvement'
      }
    ]
  },
  {
    value: 'long-form-video',
    label: 'Long Form Video Editing',
    description: 'Comprehensive editing plans for YouTube videos, documentaries, and presentations',
    placeholder: 'Describe video length, content type, target audience, style preferences, and key segments',
    examples: [
      {
        text: 'Create editing concept for a 20-minute educational YouTube video about digital marketing. Include chapter markers, lower thirds, and engaging graphics. Professional, informative style.',
        category: 'Educational Content',
        industry: 'Marketing'
      },
      {
        text: 'Design editing plan for a corporate training video about workplace safety. Clear structure with demonstrations, key point highlights, and assessment sections.',
        category: 'Training Video',
        industry: 'Corporate'
      }
    ]
  },
  {
    value: 'motion-graphics',
    label: 'Motion Graphics',
    description: 'Animated graphics and motion design concepts',
    placeholder: 'Describe the animation purpose, style, duration, and key visual elements needed',
    examples: [
      {
        text: 'Create motion graphics concept for a fintech app explainer video. Clean, modern animations showing data visualization and app interface. 60-second duration.',
        category: 'Explainer Animation',
        industry: 'Finance'
      },
      {
        text: 'Design animated logo reveal for a gaming company. Dynamic, energetic animation with particle effects and bold typography. 5-second duration.',
        category: 'Logo Animation',
        industry: 'Gaming'
      }
    ]
  },
  {
    value: 'video-ads',
    label: 'Video Ads',
    description: 'Concepts for promotional video advertisements across platforms',
    placeholder: 'Specify platform (Facebook, YouTube, Instagram), ad duration, target audience, and call-to-action',
    examples: [
      {
        text: 'Create concept for 15-second Facebook video ad for meal delivery service. Show food preparation and delivery process. Include discount offer and clear CTA.',
        category: 'Facebook Ad',
        industry: 'Food Delivery'
      },
      {
        text: 'Design YouTube pre-roll ad concept for a fitness app. 30 seconds showcasing app features and user transformations. Target fitness enthusiasts.',
        category: 'YouTube Ad',
        industry: 'Fitness'
      }
    ]
  },
  {
    value: 'animated-explainers',
    label: 'Animated Explainers',
    description: 'Animated videos explaining products, services, or concepts',
    placeholder: 'Describe what needs to be explained, target audience, preferred animation style, and key points to cover',
    examples: [
      {
        text: 'Create animated explainer for a cryptocurrency trading platform. Simple, friendly animation style explaining how to buy and sell crypto. 90-second duration.',
        category: 'Product Explainer',
        industry: 'Cryptocurrency'
      },
      {
        text: 'Design educational animation about renewable energy for middle school students. Colorful, engaging style with character guides and simple explanations.',
        category: 'Educational Animation',
        industry: 'Education'
      }
    ]
  },

  // Web Development
  {
    value: 'website-design',
    label: 'Website Design',
    description: 'Complete website design concepts and layouts',
    placeholder: 'Describe your business, target audience, required pages, style preferences, and functionality needs',
    examples: [
      {
        text: 'Design a modern website for a digital marketing agency. Clean, professional layout with case studies section, team page, and service offerings. Include contact forms and testimonials.',
        category: 'Business Website',
        industry: 'Marketing'
      },
      {
        text: 'Create website design for an online art gallery. Minimalist design focusing on artwork display. Include artist profiles, exhibition calendar, and e-commerce functionality.',
        category: 'Portfolio Website',
        industry: 'Art & Culture'
      }
    ]
  },
  {
    value: 'landing-pages',
    label: 'Landing Pages',
    description: 'High-converting landing page designs for specific campaigns',
    placeholder: 'Describe your offer, target audience, conversion goal, and key messaging',
    examples: [
      {
        text: 'Design landing page for SaaS free trial signup. Clear value proposition, feature highlights, social proof, and prominent CTA button. Target small business owners.',
        category: 'SaaS Landing Page',
        industry: 'Software'
      },
      {
        text: 'Create landing page for online course launch. Include course curriculum, instructor bio, student testimonials, and limited-time pricing offer.',
        category: 'Course Landing Page',
        industry: 'Education'
      }
    ]
  },
  {
    value: 'ui-ux-design',
    label: 'UI/UX Design',
    description: 'User interface and user experience design concepts',
    placeholder: 'Describe the app/website purpose, user flow, target users, and specific features needed',
    examples: [
      {
        text: 'Design mobile app UI for a meditation app. Calming color scheme with intuitive navigation. Include meditation timer, progress tracking, and session library.',
        category: 'Mobile App UI',
        industry: 'Wellness'
      },
      {
        text: 'Create dashboard UX design for project management software. Clean layout with task views, team collaboration features, and progress visualization.',
        category: 'Dashboard Design',
        industry: 'Productivity'
      }
    ]
  },
  {
    value: 'figma-prototypes',
    label: 'Figma Prototypes',
    description: 'Interactive prototypes and design systems in Figma',
    placeholder: 'Describe the prototype purpose, user interactions, screen flows, and design requirements',
    examples: [
      {
        text: 'Create interactive Figma prototype for e-commerce checkout flow. Include product selection, cart review, payment forms, and confirmation screens.',
        category: 'E-commerce Prototype',
        industry: 'Retail'
      },
      {
        text: 'Design Figma prototype for social media app onboarding. Include account creation, profile setup, friend connections, and first post creation.',
        category: 'Onboarding Flow',
        industry: 'Social Media'
      }
    ]
  },
  {
    value: 'responsive-design',
    label: 'Responsive Design',
    description: 'Multi-device responsive design concepts',
    placeholder: 'Describe the website/app, target devices, breakpoints, and responsive behavior requirements',
    examples: [
      {
        text: 'Create responsive design concept for restaurant website. Optimize for mobile ordering, tablet menu browsing, and desktop reservation system.',
        category: 'Restaurant Website',
        industry: 'Food & Beverage'
      },
      {
        text: 'Design responsive layout for news website. Focus on article readability across devices, mobile-first navigation, and advertisement placement.',
        category: 'News Website',
        industry: 'Media'
      }
    ]
  },

  // Marketing Materials
  {
    value: 'email-templates',
    label: 'Email Templates',
    description: 'Professional email templates and campaigns',
    placeholder: 'Specify the email type (welcome, promotional, newsletter), target audience, and key messaging',
    examples: [
      {
        text: 'Design a welcome email template for new customers of an online bookstore. Include personalized book recommendations and a 20% discount code. Warm and friendly tone.',
        category: 'Welcome Email',
        industry: 'E-commerce'
      },
      {
        text: 'Create a monthly newsletter template for a tech startup. Include company updates, industry insights, and featured blog posts. Modern, professional design.',
        category: 'Newsletter',
        industry: 'Technology'
      }
    ]
  },
  {
    value: 'presentations',
    label: 'Presentations',
    description: 'Professional presentation designs and pitch decks',
    placeholder: 'Describe the presentation purpose, audience, key points to cover, and desired style',
    examples: [
      {
        text: 'Create a startup pitch deck for a food delivery app targeting investors. Include market opportunity, business model, and financial projections. Professional and data-driven.',
        category: 'Pitch Deck',
        industry: 'Startup'
      },
      {
        text: 'Design a quarterly business review presentation for executive team. Include performance metrics, achievements, and strategic initiatives. Corporate style.',
        category: 'Business Review',
        industry: 'Corporate'
      }
    ]
  },
  {
    value: 'brochures',
    label: 'Brochures',
    description: 'Informational brochures and marketing collateral',
    placeholder: 'Describe your business/service, target audience, brochure format, and key information to include',
    examples: [
      {
        text: 'Design a tri-fold brochure for a dental clinic. Professional, clean design with service descriptions, staff photos, and patient testimonials. Include contact and insurance information.',
        category: 'Medical Brochure',
        industry: 'Healthcare'
      },
      {
        text: 'Create a travel brochure for a luxury resort. Stunning photography layout with amenities, activities, and booking information. Elegant, vacation-inspired design.',
        category: 'Travel Brochure',
        industry: 'Hospitality'
      }
    ]
  },
  {
    value: 'flyers',
    label: 'Flyers',
    description: 'Eye-catching flyers for events and promotions',
    placeholder: 'Describe the event/promotion, target audience, key details, and design style preferences',
    examples: [
      {
        text: 'Design a flyer for a local music festival. Vibrant, energetic design with band lineup, dates, venue details, and ticket information. Rock/alternative music theme.',
        category: 'Event Flyer',
        industry: 'Entertainment'
      },
      {
        text: 'Create a promotional flyer for a fitness gym opening. Bold, motivational design with membership offers, class schedules, and facility photos.',
        category: 'Promotional Flyer',
        industry: 'Fitness'
      }
    ]
  },
  {
    value: 'sales-materials',
    label: 'Sales Materials',
    description: 'Sales presentations, one-pagers, and proposal designs',
    placeholder: 'Describe your product/service, target customers, sales process, and key selling points',
    examples: [
      {
        text: 'Create a sales one-pager for B2B software solution. Include key benefits, ROI metrics, implementation process, and pricing overview. Professional, data-driven design.',
        category: 'Sales One-Pager',
        industry: 'B2B Software'
      },
      {
        text: 'Design a proposal template for marketing agency services. Include service packages, case studies, team credentials, and project timeline. Modern, creative layout.',
        category: 'Service Proposal',
        industry: 'Marketing'
      }
    ]
  },

  // E-commerce Solutions
  {
    value: 'amazon-a-plus',
    label: 'Amazon A+ Content',
    description: 'Enhanced brand content for Amazon product listings',
    placeholder: 'Describe your product, key features, brand story, and target Amazon shoppers',
    examples: [
      {
        text: 'Create Amazon A+ content for organic skincare products. Include ingredient highlights, usage instructions, before/after comparisons, and brand sustainability story.',
        category: 'Beauty A+ Content',
        industry: 'Beauty'
      },
      {
        text: 'Design A+ content for kitchen appliances. Feature product specifications, usage scenarios, comparison charts, and customer testimonials.',
        category: 'Appliance A+ Content',
        industry: 'Home & Kitchen'
      }
    ]
  },
  {
    value: 'product-photography',
    label: 'Product Photography',
    description: 'Concepts for professional product photography setups',
    placeholder: 'Describe your product, intended use (e-commerce, catalog, ads), style preferences, and background requirements',
    examples: [
      {
        text: 'Create photography concept for luxury watches. Clean, minimalist setup with dramatic lighting. Include lifestyle shots and detail close-ups for e-commerce use.',
        category: 'Luxury Product Photography',
        industry: 'Fashion'
      },
      {
        text: 'Design photography setup for food products. Natural lighting with fresh ingredients and cooking scenes. Include packaging shots and ingredient close-ups.',
        category: 'Food Photography',
        industry: 'Food & Beverage'
      }
    ]
  },
  {
    value: 'storefront-design',
    label: 'Storefront Design',
    description: 'E-commerce storefront and shop design concepts',
    placeholder: 'Describe your products, brand style, target customers, and platform (Shopify, Amazon, etc.)',
    examples: [
      {
        text: 'Design Shopify storefront for handmade jewelry brand. Elegant, boutique-style layout with product galleries, artist story, and customization options.',
        category: 'Jewelry Store',
        industry: 'Fashion'
      },
      {
        text: 'Create Amazon storefront for fitness equipment brand. Athletic, energetic design with product categories, workout guides, and customer reviews.',
        category: 'Fitness Store',
        industry: 'Sports & Fitness'
      }
    ]
  },
  {
    value: 'listing-optimization',
    label: 'Listing Optimization',
    description: 'Product listing optimization for e-commerce platforms',
    placeholder: 'Describe your product, platform, target keywords, and optimization goals',
    examples: [
      {
        text: 'Optimize Amazon listing for wireless headphones. Include keyword-rich title, bullet points highlighting features, and compelling product description with technical specs.',
        category: 'Electronics Listing',
        industry: 'Technology'
      },
      {
        text: 'Create optimized eBay listing for vintage clothing. Detailed condition descriptions, styling suggestions, measurements, and authentic brand verification.',
        category: 'Fashion Listing',
        industry: 'Fashion'
      }
    ]
  },
  {
    value: 'product-mockups',
    label: 'Product Mockups',
    description: 'Realistic product mockups for marketing and presentations',
    placeholder: 'Describe your product, intended use context, style preferences, and background settings',
    examples: [
      {
        text: 'Create mockups for mobile app in realistic device settings. Include iPhone and Android versions in hands, on desk, and lifestyle scenarios.',
        category: 'App Mockups',
        industry: 'Technology'
      },
      {
        text: 'Design product mockups for t-shirt designs. Include various angles, colors, and lifestyle settings with models wearing the shirts.',
        category: 'Apparel Mockups',
        industry: 'Fashion'
      }
    ]
  },

  // Print & Packaging
  {
    value: 'business-cards',
    label: 'Business Cards',
    description: 'Professional business card designs',
    placeholder: 'Describe your profession/business, style preferences, required information, and any special finishes',
    examples: [
      {
        text: 'Design business cards for a freelance photographer. Creative, artistic design showcasing photography skills. Include contact info and QR code to portfolio.',
        category: 'Creative Business Cards',
        industry: 'Photography'
      },
      {
        text: 'Create minimalist business cards for a law firm. Professional, clean design with firm logo, attorney names, and contact information. Conservative color scheme.',
        category: 'Professional Business Cards',
        industry: 'Legal'
      }
    ]
  },
  {
    value: 'labels',
    label: 'Labels',
    description: 'Product labels and sticker designs',
    placeholder: 'Describe your product, label size, required information, brand guidelines, and regulatory requirements',
    examples: [
      {
        text: 'Design product labels for artisan honey jars. Natural, organic design with ingredient list, nutrition facts, and brand story. Include bee-themed illustrations.',
        category: 'Food Labels',
        industry: 'Food & Beverage'
      },
      {
        text: 'Create warning labels for industrial equipment. Clear, high-contrast design with safety symbols, instructions, and compliance information.',
        category: 'Safety Labels',
        industry: 'Industrial'
      }
    ]
  },
  {
    value: 'banners',
    label: 'Banners',
    description: 'Large format banners for events and advertising',
    placeholder: 'Describe the banner purpose, size requirements, viewing distance, and key messaging',
    examples: [
      {
        text: 'Design outdoor banner for grand opening of a restaurant. Large, eye-catching design with restaurant name, cuisine type, opening date, and special offers.',
        category: 'Grand Opening Banner',
        industry: 'Food & Beverage'
      },
      {
        text: 'Create trade show banner for tech company. Professional design highlighting products, company logo, and booth information. Portable display format.',
        category: 'Trade Show Banner',
        industry: 'Technology'
      }
    ]
  },
  {
    value: 'signage-design',
    label: 'Signage Design',
    description: 'Wayfinding and informational signage systems',
    placeholder: 'Describe the location, signage purpose, size constraints, visibility requirements, and brand guidelines',
    examples: [
      {
        text: 'Design wayfinding signage system for office building. Clean, modern design with directory boards, floor signs, and room numbers. Include accessibility compliance.',
        category: 'Office Signage',
        industry: 'Commercial'
      },
      {
        text: 'Create outdoor signage for retail store. Weather-resistant design with store name, hours, services, and promotional messaging. High visibility from street.',
        category: 'Retail Signage',
        industry: 'Retail'
      }
    ]
  }
];

export const AIGenerator: React.FC<AIGeneratorProps> = ({ onGenerationComplete }) => {
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [contentType, setContentType] = useState<'text' | 'image' | 'combo' | null>(null);
  const [currentGenerationId, setCurrentGenerationId] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const selectedServiceType = serviceTypes.find(type => type.value === serviceType);

  const getContentType = (serviceType: string): 'text' | 'image' | 'combo' => {
    const imageServices = [
      'logo-branding', 'illustrations', 'packaging-design', 'product-photography', 
      'product-mockups', 'business-cards', 'labels', 'banners', 'signage-design'
    ];
    const comboServices = [
      'social-media-graphics', 'print-design', 'website-design', 'landing-pages', 
      'ui-ux-design', 'figma-prototypes', 'responsive-design', 'brochures', 'flyers',
      'storefront-design', 'amazon-a-plus'
    ];
    
    if (imageServices.includes(serviceType)) return 'image';
    if (comboServices.includes(serviceType)) return 'combo';
    return 'text';
  };

  const handleUseExample = (exampleText: string) => {
    setDescription(exampleText);
    toast({
      title: "Example Applied",
      description: "The example prompt has been added to your description.",
    });
  };

  const handleGenerate = async () => {
    if (!serviceType || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a service type and provide a description.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate content.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);
    setGeneratedImage(null);

    try {
      // Create a generation record first
      const { data: generation, error: insertError } = await supabase
        .from('ai_generations')
        .insert({
          user_id: user.id,
          service_type: serviceType,
          description: description,
          content_type: getContentType(serviceType),
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        throw new Error('Failed to create generation record');
      }

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          serviceType,
          description,
          userId: user.id,
          generationId: generation.id
        }
      });

      if (error) {
        throw error;
      }

      setGeneratedContent(data.generatedContent);
      setGeneratedImage(data.imageUrl);
      setContentType(data.contentType);
      setCurrentGenerationId(generation.id);
      setShowPreview(true);

      toast({
        title: "Content Generated!",
        description: "Review your content and save to history when ready.",
      });

    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `ai-generated-${serviceType}-${Date.now()}.png`;
      link.click();
    }
  };

  const handleSaveToHistory = async () => {
    if (!currentGenerationId) return;

    try {
      const { error } = await supabase
        .from('ai_generations')
        .update({ 
          status: 'completed',
          client_email: clientEmail || null,
          purchase_order_id: purchaseOrderId || null
        })
        .eq('id', currentGenerationId);

      if (error) throw error;

      toast({ title: "Saved to history successfully!" });
      
      // Reset the preview state
      setShowPreview(false);
      setGeneratedContent(null);
      setGeneratedImage(null);
      setCurrentGenerationId('');
      setDescription('');
      
      // Call callback if provided
      onGenerationComplete?.();
    } catch (error) {
      console.error('Error saving to history:', error);
      toast({ title: "Error saving to history", variant: "destructive" });
    }
  };

  const handleDiscard = async () => {
    if (!currentGenerationId) return;

    try {
      const { error } = await supabase
        .from('ai_generations')
        .delete()
        .eq('id', currentGenerationId);

      if (error) throw error;

      toast({ title: "Generation discarded" });
      
      // Reset the preview state
      setShowPreview(false);
      setGeneratedContent(null);
      setGeneratedImage(null);
      setCurrentGenerationId('');
    } catch (error) {
      console.error('Error discarding generation:', error);
      toast({ title: "Error discarding generation", variant: "destructive" });
    }
  };

  const handleRegenerateWithSamePrompt = () => {
    handleGenerate();
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI Design Generator
        </CardTitle>
        <CardDescription>
          Generate professional content for your marketing needs using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Information Section */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h3 className="font-semibold text-sm">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label htmlFor="client-email">Client Email</Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Email address of the client for this project</p>
                </TooltipContent>
              </Tooltip>
              <Input
                id="client-email"
                type="email"
                placeholder="client@company.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label htmlFor="purchase-order">Purchase Order ID</Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Purchase order or project reference number</p>
                </TooltipContent>
              </Tooltip>
              <Input
                id="purchase-order"
                placeholder="PO-2024-001"
                value={purchaseOrderId}
                onChange={(e) => setPurchaseOrderId(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Label htmlFor="service-type">Service Type</Label>
            </TooltipTrigger>
            <TooltipContent>
              <p>Choose the type of content you want to generate</p>
            </TooltipContent>
          </Tooltip>
          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger>
              <SelectValue placeholder="Select a service type" />
            </SelectTrigger>
            <SelectContent>
              {serviceTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


        {selectedServiceType && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Example Prompts for {selectedServiceType.label}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{selectedServiceType.description}</p>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="examples">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AccordionTrigger className="text-sm">
                      View Example Prompts ({selectedServiceType.examples.length})
                    </AccordionTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Use these professionally crafted examples as starting points for your own content</p>
                  </TooltipContent>
                </Tooltip>
                <AccordionContent>
                  <div className="space-y-4">
                    {selectedServiceType.examples.map((example, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-background">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {example.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {example.industry}
                          </Badge>
                        </div>
                        <p className="text-sm mb-3 text-foreground">{example.text}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUseExample(example.text)}
                          className="w-full"
                        >
                          Use This Example
                        </Button>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        <div className="space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Label htmlFor="description">Description</Label>
            </TooltipTrigger>
            <TooltipContent>
              <p>Provide detailed instructions for better AI results. Be specific about your target audience, style, and requirements</p>
            </TooltipContent>
          </Tooltip>
          <Textarea
            id="description"
            placeholder={selectedServiceType?.placeholder || "Describe what you want to create (e.g., 'A fitness app for busy professionals' or 'Luxury skincare brand for millennials')"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>


        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={handleGenerate} 
              className="w-full" 
              size="lg"
              disabled={isGenerating || !serviceType || !description.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Content
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to create AI-powered content based on your specifications</p>
          </TooltipContent>
        </Tooltip>

        {/* Preview Mode - Generated Content Display */}
        {showPreview && (generatedContent || generatedImage) && (
          <div className="space-y-4 p-6 bg-muted/30 rounded-lg border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-primary" />
                Generated Preview
              </h3>
              <Badge variant="secondary">Draft</Badge>
            </div>

            {generatedContent && (
              <div className="p-4 bg-background rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Generated Content</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedContent)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  {generatedContent}
                </p>
              </div>
            )}

            {generatedImage && (
              <div className="p-4 bg-background rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Generated Image</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadImage}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <img 
                  src={generatedImage} 
                  alt="Generated content" 
                  className="w-full max-w-md mx-auto rounded-lg shadow-md"
                />
              </div>
            )}

            {/* Revision Controls */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleRegenerateWithSamePrompt}
                    disabled={isGenerating}
                    className="flex-1 min-w-[140px]"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Again
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create a new version with the same prompt</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleDiscard}
                    className="flex-1 min-w-[120px]"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Discard
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete this generation and start over</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSaveToHistory}
                    className="flex-1 min-w-[140px]"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save to History
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Keep this version in your permanent collection</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};