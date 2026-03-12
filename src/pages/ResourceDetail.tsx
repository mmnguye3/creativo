import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, User, Calendar } from "lucide-react";
import { resources } from "@/data/resources";

// Hero images
import designAgencyHero from "@/assets/resources/design-agency-hero.jpg";

const heroImages: Record<string, string> = {
  "complete-guide-starting-design-agency": designAgencyHero,
};

const ResourceDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const resource = slug ? resources[slug] : null;
  const heroImage = slug ? heroImages[slug] : null;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (resource) {
      document.title = `${resource.title} | Creativo`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", resource.metaDescription);
    }
  }, [resource]);

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
      {/* Hero Banner */}
      {heroImage && (
        <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
          <img
            src={heroImage}
            alt={resource.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="container mx-auto max-w-4xl">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/resources")}
                className="mb-4 text-foreground/80 hover:text-foreground bg-background/30 backdrop-blur-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Resources
              </Button>
            </div>
          </div>
        </div>
      )}

      <article className="container mx-auto px-4 max-w-4xl">
        {/* Header section */}
        <div className={heroImage ? "-mt-16 relative z-10" : "pt-12"}>
          <div className={heroImage ? "bg-background rounded-t-2xl p-8 md:p-12 shadow-2xl" : ""}>
            {!heroImage && (
              <Button variant="ghost" onClick={() => navigate("/resources")} className="mb-8">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Resources
              </Button>
            )}

            <div className="flex flex-wrap gap-2 mb-5">
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                {resource.type}
              </Badge>
              <Badge variant="outline">{resource.category}</Badge>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-[3.25rem] font-bold leading-tight mb-6 tracking-tight">
              {resource.title}
            </h1>

            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium">{resource.author}</span>
              </div>
              <Separator orientation="vertical" className="h-5" />
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {resource.date}
              </div>
              <Separator orientation="vertical" className="h-5" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {resource.readTime}
              </div>
            </div>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="my-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="w-2 h-2 rounded-full bg-primary/50" />
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>

        {/* Article content */}
        <div
          className="
            prose prose-lg dark:prose-invert max-w-none
            prose-headings:text-foreground prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-14 prose-h2:mb-5
            prose-h2:pb-3 prose-h2:border-b prose-h2:border-primary/20
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-primary/90
            prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-base prose-p:md:text-lg
            prose-strong:text-foreground prose-strong:font-semibold
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-li:text-muted-foreground prose-li:leading-relaxed
            prose-ul:my-4 prose-ol:my-4
            prose-th:text-foreground prose-td:text-muted-foreground
            prose-table:rounded-lg prose-table:overflow-hidden
            prose-table:border prose-table:border-border
            prose-th:border prose-th:border-border prose-th:px-4 prose-th:py-3 prose-th:bg-muted/50
            prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-3
            prose-blockquote:border-l-primary prose-blockquote:bg-primary/5
            prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-6
            first-letter:text-5xl first-letter:font-bold first-letter:text-primary
            first-letter:mr-1 first-letter:float-left first-letter:leading-none first-letter:mt-1
          "
          dangerouslySetInnerHTML={{ __html: resource.content }}
        />

        {/* Tags footer */}
        <div className="my-14">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="w-2 h-2 rounded-full bg-primary/50" />
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>
          <div className="flex flex-wrap gap-2 justify-center pt-4">
            {resource.tags.map((tag, i) => (
              <Badge
                key={i}
                variant="outline"
                className="px-4 py-1.5 text-sm border-primary/20 hover:bg-primary/5 transition-colors"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* CTA Card */}
        <div className="mb-16 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 md:p-12 text-center">
          <h3 className="text-2xl font-bold mb-3">Ready to Start Your Agency?</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Launch your white-label design agency with Creativo and start delivering world-class design under your own brand.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/pricing")}
            className="bg-gradient-to-r from-primary to-[hsl(45,95%,55%)] text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
          >
            Explore Agency Plans
          </Button>
        </div>
      </article>
    </div>
  );
};

export default ResourceDetail;
