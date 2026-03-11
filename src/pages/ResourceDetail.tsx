import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, User, Calendar } from "lucide-react";

const resources: Record<string, {
  title: string;
  category: string;
  type: string;
  readTime: string;
  author: string;
  date: string;
  tags: string[];
  content: string;
}> = {
  "complete-guide-starting-design-agency": {
    title: "Complete Guide to Starting a Design Agency",
    category: "Getting Started",
    type: "Guide",
    readTime: "15 min read",
    author: "Alex Chen",
    date: "Dec 15, 2024",
    tags: ["Agency", "Business", "Startup"],
    content: "Content coming soon..."
  },
  "10-design-trends-2025": {
    title: "10 Design Trends That Will Dominate 2025",
    category: "Design Tips",
    type: "Article",
    readTime: "8 min read",
    author: "Sarah Rodriguez",
    date: "Dec 12, 2024",
    tags: ["Trends", "Design", "2025"],
    content: "Content coming soon..."
  },
  "how-to-price-design-services": {
    title: "How to Price Your Design Services",
    category: "Business Growth",
    type: "Video",
    readTime: "25 min watch",
    author: "Mike Johnson",
    date: "Dec 10, 2024",
    tags: ["Pricing", "Revenue", "Strategy"],
    content: "Content coming soon..."
  },
  "client-onboarding-template-pack": {
    title: "Client Onboarding Template Pack",
    category: "Getting Started",
    type: "Template",
    readTime: "Download",
    author: "Emma Thompson",
    date: "Dec 8, 2024",
    tags: ["Templates", "Clients", "Process"],
    content: "Content coming soon..."
  },
  "social-media-marketing-design-agencies": {
    title: "Social Media Marketing for Design Agencies",
    category: "Marketing",
    type: "Guide",
    readTime: "12 min read",
    author: "Lisa Park",
    date: "Dec 5, 2024",
    tags: ["Social Media", "Marketing", "Clients"],
    content: "Content coming soon..."
  },
  "design-agency-success-story": {
    title: "From $0 to $100K: A Design Agency Success Story",
    category: "Case Studies",
    type: "Case Study",
    readTime: "10 min read",
    author: "Case Study Team",
    date: "Dec 3, 2024",
    tags: ["Success Story", "Growth", "Revenue"],
    content: "Content coming soon..."
  },
  "ux-ui-design-best-practices-2025": {
    title: "UX/UI Design Best Practices for 2025",
    category: "Design Tips",
    type: "Article",
    readTime: "14 min read",
    author: "David Kim",
    date: "Nov 30, 2024",
    tags: ["UX", "UI", "Best Practices"],
    content: "Content coming soon..."
  },
  "building-profitable-design-subscription-model": {
    title: "Building a Profitable Design Subscription Model",
    category: "Business Growth",
    type: "Video",
    readTime: "30 min watch",
    author: "Rachel Green",
    date: "Nov 28, 2024",
    tags: ["Subscription", "Revenue", "Business Model"],
    content: "Content coming soon..."
  }
};

const ResourceDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const resource = slug ? resources[slug] : null;

  if (!resource) {
    return (
      <div className="pt-20 min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Resource Not Found</h1>
        <Button onClick={() => navigate("/resources")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Resources
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-20">
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/resources")} className="mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Resources
        </Button>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">{resource.type}</Badge>
          <Badge variant="outline">{resource.category}</Badge>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold mb-6">{resource.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 border-b border-border pb-6">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {resource.author}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {resource.date}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {resource.readTime}
          </div>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: resource.content }} />
        </div>

        <div className="flex flex-wrap gap-2 mt-12 pt-6 border-t border-border">
          {resource.tags.map((tag, i) => (
            <Badge key={i} variant="outline">{tag}</Badge>
          ))}
        </div>
      </article>
    </div>
  );
};

export default ResourceDetail;
