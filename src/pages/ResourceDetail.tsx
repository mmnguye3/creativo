import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { resources } from "@/data/resources";

const ResourceDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const resource = slug ? resources[slug] : null;

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
        <button
          onClick={() => navigate("/resources")}
          className="text-primary hover:underline"
        >
          ← Back to Resources
        </button>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border">
        <div className="container mx-auto px-6 md:px-8 max-w-6xl py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate("/resources")}
              className="text-primary hover:underline font-medium"
            >
              Blog
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="text-primary font-medium">{resource.category}</span>
          </div>
        </div>
      </div>

      {/* Article Layout */}
      <div className="container mx-auto px-6 md:px-8 max-w-6xl">
        {/* Hero Image */}
        {resource.heroImage && (
          <div className="mt-12 md:mt-20 rounded-2xl overflow-hidden border border-border">
            <img
              src={resource.heroImage}
              alt={resource.title}
              className="w-full h-auto object-cover max-h-[480px]"
              loading="eager"
            />
          </div>
        )}

        {/* Title Section */}
        <div className="pt-8 md:pt-12 pb-8 md:pb-12 max-w-3xl ml-auto">
          <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight text-foreground">
            {resource.title}
          </h1>
          <div className="mt-6 flex items-center gap-1.5 text-sm text-muted-foreground border-l-2 border-primary pl-3">
            {resource.date}
          </div>
        </div>

        {/* Two-column: Author sidebar + Content */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 pb-20">
          {/* Author Sidebar */}
          <aside className="md:w-52 flex-shrink-0">
            <div className="md:sticky md:top-28">
              <div className="flex md:flex-col gap-4">
                <div className="flex items-center md:items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground flex-shrink-0">
                    {resource.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{resource.author}</div>
                    <div className="text-xs text-muted-foreground">Creativo Team</div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                  <Clock className="w-3.5 h-3.5" />
                  {resource.readTime}
                </div>
              </div>
            </div>
          </aside>

          {/* Article Content */}
          <article className="flex-1 min-w-0 max-w-3xl">
            <div
              className="
                stripe-article-prose
                prose prose-lg dark:prose-invert max-w-none
                prose-headings:text-foreground prose-headings:tracking-tight prose-headings:font-bold
                prose-h2:text-[1.65rem] prose-h2:md:text-[1.85rem] prose-h2:mt-12 prose-h2:mb-4 prose-h2:leading-tight
                prose-h3:text-lg prose-h3:md:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-muted-foreground prose-p:leading-[1.75] prose-p:text-[1.05rem] prose-p:md:text-[1.1rem]
                prose-strong:text-foreground prose-strong:font-semibold
                prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                prose-li:text-muted-foreground prose-li:leading-[1.75]
                prose-ul:my-4 prose-ol:my-4
                prose-th:text-foreground prose-td:text-muted-foreground
                prose-table:rounded-xl prose-table:overflow-hidden
                prose-table:border prose-table:border-border
                prose-th:border prose-th:border-border prose-th:px-4 prose-th:py-3 prose-th:bg-muted/50 prose-th:text-sm prose-th:font-semibold
                prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-3 prose-td:text-sm
                prose-blockquote:border-l-2 prose-blockquote:border-primary
                prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-foreground/80
                prose-blockquote:not-italic prose-blockquote:font-normal
                prose-img:rounded-xl prose-img:border prose-img:border-border
              "
              dangerouslySetInnerHTML={{ __html: resource.content }}
            />

            {/* Tags */}
            <div className="mt-16 pt-8 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 p-8 md:p-10 rounded-2xl bg-muted/50 border border-border">
              <h3 className="text-xl font-bold text-foreground mb-2">Ready to Start Your Agency?</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-md">
                Launch your white-label design agency with Creativo and start delivering world-class design under your own brand.
              </p>
              <button
                onClick={() => navigate("/pricing")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Explore Agency Plans <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetail;
