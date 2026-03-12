import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, User, Calendar } from "lucide-react";
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

        <div
          className="prose prose-lg dark:prose-invert max-w-none
            prose-headings:text-foreground prose-p:text-muted-foreground
            prose-strong:text-foreground prose-a:text-primary
            prose-li:text-muted-foreground prose-th:text-foreground
            prose-td:text-muted-foreground
            prose-table:border prose-th:border prose-th:px-4 prose-th:py-2
            prose-td:border prose-td:px-4 prose-td:py-2
            prose-h2:mt-10 prose-h2:mb-4 prose-h3:mt-6 prose-h3:mb-3"
          dangerouslySetInnerHTML={{ __html: resource.content }}
        />

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
