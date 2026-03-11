import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search,
  BookOpen,
  Video,
  Download,
  ExternalLink,
  Clock,
  User,
  ArrowRight,
  FileText,
  Lightbulb,
  TrendingUp
} from "lucide-react";

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const navigate = useNavigate();

  const categories = ["All", "Getting Started", "Design Tips", "Business Growth", "Marketing", "Case Studies"];

  const resources = [
    {
      id: 1,
      title: "Complete Guide to Starting a Design Agency",
      slug: "complete-guide-starting-design-agency",
      description: "Everything you need to know about launching and scaling a successful design agency from scratch.",
      category: "Getting Started",
      type: "Guide",
      readTime: "15 min read",
      author: "Alex Chen",
      date: "Dec 15, 2024",
      tags: ["Agency", "Business", "Startup"],
      icon: BookOpen,
      featured: true
    },
    {
      id: 2,
      title: "10 Design Trends That Will Dominate 2025",
      slug: "10-design-trends-2025",
      description: "Stay ahead of the curve with these emerging design trends that will shape the industry.",
      category: "Design Tips",
      type: "Article",
      readTime: "8 min read",
      author: "Sarah Rodriguez",
      date: "Dec 12, 2024",
      tags: ["Trends", "Design", "2025"],
      icon: Lightbulb
    },
    {
      id: 3,
      title: "How to Price Your Design Services",
      description: "A comprehensive guide to pricing strategies that will help you maximize revenue and profit.",
      category: "Business Growth",
      type: "Video",
      readTime: "25 min watch",
      author: "Mike Johnson",
      date: "Dec 10, 2024",
      tags: ["Pricing", "Revenue", "Strategy"],
      icon: Video
    },
    {
      id: 4,
      title: "Client Onboarding Template Pack",
      description: "Ready-to-use templates for streamlining your client onboarding process.",
      category: "Getting Started",
      type: "Template",
      readTime: "Download",
      author: "Emma Thompson",
      date: "Dec 8, 2024",
      tags: ["Templates", "Clients", "Process"],
      icon: Download
    },
    {
      id: 5,
      title: "Social Media Marketing for Design Agencies",
      description: "Proven strategies to build your agency's presence and attract clients through social media.",
      category: "Marketing",
      type: "Guide",
      readTime: "12 min read",
      author: "Lisa Park",
      date: "Dec 5, 2024",
      tags: ["Social Media", "Marketing", "Clients"],
      icon: TrendingUp
    },
    {
      id: 6,
      title: "From $0 to $100K: A Design Agency Success Story",
      description: "How one agency grew from startup to six figures using our white-label platform.",
      category: "Case Studies",
      type: "Case Study",
      readTime: "10 min read",
      author: "Case Study Team",
      date: "Dec 3, 2024",
      tags: ["Success Story", "Growth", "Revenue"],
      icon: FileText,
      featured: true
    },
    {
      id: 7,
      title: "UX/UI Design Best Practices for 2025",
      description: "Essential principles and practices for creating exceptional user experiences.",
      category: "Design Tips",
      type: "Article",
      readTime: "14 min read",
      author: "David Kim",
      date: "Nov 30, 2024",
      tags: ["UX", "UI", "Best Practices"],
      icon: BookOpen
    },
    {
      id: 8,
      title: "Building a Profitable Design Subscription Model",
      description: "Learn how to create recurring revenue with design subscription services.",
      category: "Business Growth",
      type: "Video",
      readTime: "30 min watch",
      author: "Rachel Green",
      date: "Nov 28, 2024",
      tags: ["Subscription", "Revenue", "Business Model"],
      icon: Video
    }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredResources = resources.filter(resource => resource.featured);

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Resource <span className="bg-gradient-primary bg-clip-text text-transparent">Center</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Guides, tutorials, and resources to help you build and grow a successful design agency.
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-12 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      {!searchTerm && selectedCategory === "All" && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Resources</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Don't miss these essential resources for design agency success.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredResources.map((resource) => (
                <Card key={resource.id} className="hover-lift bg-gradient-card border-white/10 border-2 border-primary/20">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                          <resource.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <Badge variant="secondary">{resource.type}</Badge>
                          <Badge className="ml-2">Featured</Badge>
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-xl">{resource.title}</CardTitle>
                    <CardDescription className="text-base">
                      {resource.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {resource.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {resource.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {resource.readTime}
                        </div>
                      </div>
                      <span>{resource.date}</span>
                    </div>
                    
                    <Button className="w-full group">
                      {resource.type === "Template" ? "Download" : "Read More"}
                      <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Resources */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {searchTerm ? `Search Results (${filteredResources.length})` : "All Resources"}
            </h2>
            {selectedCategory !== "All" && (
              <p className="text-muted-foreground">
                Showing resources in: <span className="text-primary font-semibold">{selectedCategory}</span>
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="hover-lift bg-gradient-card border-white/10">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <resource.icon className="w-4 h-4 text-white" />
                    </div>
                    <Badge variant="secondary">{resource.type}</Badge>
                  </div>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {resource.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {resource.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{resource.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {resource.readTime}
                    </div>
                    <span>{resource.date}</span>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full group">
                    {resource.type === "Template" ? "Download" : "Read More"}
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No resources found matching your search.</p>
              <Button 
                variant="outline" 
                onClick={() => {setSearchTerm(""); setSelectedCategory("All");}}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-card border-white/10 text-center">
            <CardHeader>
              <CardTitle className="text-3xl mb-4">Stay Updated</CardTitle>
              <CardDescription className="text-lg mb-6">
                Get the latest resources, tips, and industry insights delivered to your inbox weekly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto flex gap-4">
                <Input placeholder="Enter your email" type="email" />
                <Button>
                  Subscribe
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Join 5,000+ design professionals. Unsubscribe anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Resources;