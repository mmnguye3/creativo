import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Download, Eye, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Generation {
  id: string;
  service_type: string;
  description: string;
  generated_content: string | null;
  content_type: 'text' | 'image' | 'combo';
  image_url: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  client_email: string | null;
  purchase_order_id: string | null;
}

export const GenerationHistory: React.FC = () => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchGenerations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_generations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed') // Only show completed generations
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      setGenerations(data as Generation[] || []);
    } catch (error) {
      console.error('Error fetching generations:', error);
      toast({
        title: "Error",
        description: "Failed to load generation history.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerations();
  }, [user]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  const downloadImage = (imageUrl: string, generationId: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-generated-${generationId}.png`;
    link.click();
  };

  const getServiceTypeLabel = (serviceType: string) => {
    const labels: { [key: string]: string } = {
      'social-media-ads': 'Social Media Ads',
      'email-designs': 'Email Designs',
      'presentations': 'Presentations',
      'logos-branding': 'Logos & Branding',
      'illustrations': 'Illustrations',
    };
    return labels[serviceType] || serviceType;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Generation History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Generation History
        </CardTitle>
        <CardDescription>
          Your recent AI-generated content
        </CardDescription>
      </CardHeader>
      <CardContent>
        {generations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No generations yet. Create your first AI-generated content above!
          </div>
        ) : (
          <ScrollArea className="h-[2100px]">
            <div className="space-y-4">
              {generations.map((generation) => (
                <div
                  key={generation.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getServiceTypeLabel(generation.service_type)}
                      </Badge>
                      <Badge variant={getStatusColor(generation.status)}>
                        {generation.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(generation.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* Client Information */}
                  {(generation.client_email || generation.purchase_order_id) && (
                    <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2 rounded">
                      {generation.client_email && (
                        <div>
                          <span className="font-medium">Client:</span> {generation.client_email}
                        </div>
                      )}
                      {generation.purchase_order_id && (
                        <div>
                          <span className="font-medium">PO:</span> {generation.purchase_order_id}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground">
                    {generation.description}
                  </p>

                  {generation.status === 'completed' && (
                    <div className="space-y-2">
                      {generation.generated_content && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(generation.generated_content!)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Text
                          </Button>
                        </div>
                      )}
                      
                      {generation.image_url && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadImage(generation.image_url!, generation.id)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download Image
                            </Button>
                          </div>
                          <div className="border rounded overflow-hidden">
                            <img 
                              src={generation.image_url} 
                              alt="Generated content" 
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};