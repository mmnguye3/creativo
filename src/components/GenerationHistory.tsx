import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Download, History, ExternalLink, Megaphone } from "lucide-react";
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
  image_model: string | null;
  status: 'pending' | 'draft' | 'completed' | 'failed';
  created_at: string;
  client_email: string | null;
  purchase_order_id: string | null;
  metadata?: Record<string, string> | null;
}

const MODEL_BADGE: Record<string, { label: string; cls: string }> = {
  'fal-ai/ideogram/v3':  { label: 'Ideogram v3',  cls: 'bg-purple-500/15 text-purple-400 border-purple-500/25' },
  'fal-ai/recraft-v3':   { label: 'Recraft V3',   cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  'fal-ai/flux/schnell': { label: 'FLUX Schnell',  cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25' },
  'fal-ai/flux-pro/v1.1':{ label: 'FLUX Pro',     cls: 'bg-violet-500/15 text-violet-400 border-violet-500/25' },
  'dall-e-3':            { label: 'DALL·E 3',      cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25' },
};

function ModelBadge({ model }: { model: string | null }) {
  if (!model) return null;
  const info = MODEL_BADGE[model] ?? { label: model.split('/').pop() ?? model, cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${info.cls}`}>
      {info.label}
    </span>
  );
}

interface GenerationHistoryProps {
  onViewAdCampaign?: (generation: Generation) => void;
}

const PLATFORM_LABELS: Record<string, string> = {
  'facebook-instagram': 'FB/IG',
  'google-ads': 'Google',
  'tiktok': 'TikTok',
};

const OBJECTIVE_LABELS: Record<string, string> = {
  'conversions': 'Conversions',
  'traffic': 'Traffic',
  'brand-awareness': 'Brand Awareness',
  'lead-generation': 'Lead Gen',
};

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({ onViewAdCampaign }) => {
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
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setGenerations((data as unknown as Generation[]) || []);
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
    toast({ title: "Copied!", description: "Content copied to clipboard." });
  };

  const downloadImage = (imageUrl: string, generationId: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-generated-${generationId}.png`;
    link.click();
  };

  const getServiceTypeLabel = (serviceType: string) => {
    if (serviceType === 'ad-campaign') return 'Ad Campaign';
    const labels: Record<string, string> = {
      'social-media-ads': 'Social Media Ads',
      'social-media-graphics': 'Social Media Graphics',
      'email-designs': 'Email Designs',
      'email-templates': 'Email Templates',
      'presentations': 'Presentations',
      'logos-branding': 'Logos & Branding',
      'logo-branding': 'Logo & Branding',
      'illustrations': 'Illustrations',
      'website-design': 'Website Design',
      'landing-pages': 'Landing Pages',
      'ui-ux-design': 'UI/UX Design',
    };
    return labels[serviceType] || serviceType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'secondary';
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
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
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
        <CardDescription>Your recent AI-generated content</CardDescription>
      </CardHeader>
      <CardContent>
        {generations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No generations yet. Create your first AI-generated content above!
          </div>
        ) : (
          <ScrollArea className="h-[2100px]">
            <div className="space-y-4">
              {generations.map((generation) => {
                const isAdCampaign = generation.service_type === 'ad-campaign';
                const meta = generation.metadata || {};
                const platformLabel = PLATFORM_LABELS[meta.platform || ''];
                const objectiveLabel = OBJECTIVE_LABELS[meta.objective || ''];

                return (
                  <div key={generation.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isAdCampaign && <Megaphone className="h-4 w-4 text-orange-400 flex-shrink-0" />}
                        <Badge variant="outline">{getServiceTypeLabel(generation.service_type)}</Badge>
                        <Badge variant={getStatusColor(generation.status)}>{generation.status}</Badge>
                        {isAdCampaign && platformLabel && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">
                            {platformLabel}
                          </Badge>
                        )}
                        {isAdCampaign && objectiveLabel && (
                          <Badge variant="secondary" className="text-[10px]">{objectiveLabel}</Badge>
                        )}
                        <ModelBadge model={generation.image_model} />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(generation.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Ad campaign: thumbnail + open button */}
                    {isAdCampaign && (
                      <div className="flex items-center gap-3">
                        {generation.image_url && (
                          <div className="w-14 h-14 rounded-md overflow-hidden border border-white/10 flex-shrink-0">
                            <img
                              src={generation.image_url}
                              alt="Ad creative"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground line-clamp-2">{generation.description}</p>
                        </div>
                        {onViewAdCampaign && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
                            onClick={() => onViewAdCampaign(generation)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Non-ad-campaign: existing layout */}
                    {!isAdCampaign && (
                      <>
                        {(generation.client_email || generation.purchase_order_id) && (
                          <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2 rounded">
                            {generation.client_email && (
                              <div><span className="font-medium">Client:</span> {generation.client_email}</div>
                            )}
                            {generation.purchase_order_id && (
                              <div><span className="font-medium">PO:</span> {generation.purchase_order_id}</div>
                            )}
                          </div>
                        )}

                        <p className="text-sm text-muted-foreground">{generation.description}</p>

                        {generation.status === 'completed' && (
                          <div className="space-y-2">
                            {generation.generated_content && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(generation.generated_content!)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Text
                              </Button>
                            )}
                            {generation.image_url && (
                              <div className="space-y-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadImage(generation.image_url!, generation.id)}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download Image
                                </Button>
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
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
