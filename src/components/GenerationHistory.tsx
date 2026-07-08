import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Download, History, ExternalLink, Megaphone, Clock, ShieldX, CheckCircle2 } from "lucide-react";
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
  review_status: 'pending_review' | 'approved' | 'rejected' | null;
  rejection_reason: string | null;
  created_at: string;
  client_email: string | null;
  purchase_order_id: string | null;
  metadata?: Record<string, string> | null;
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
        .or('status.eq.completed,review_status.eq.pending_review,review_status.eq.rejected')
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
                        {/* Review-status badge takes precedence for pending_review / rejected */}
                        {generation.review_status === 'pending_review' ? (
                          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[10px] flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> In review
                          </Badge>
                        ) : generation.review_status === 'rejected' ? (
                          <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-[10px] flex items-center gap-1">
                            <ShieldX className="h-2.5 w-2.5" /> Rejected
                          </Badge>
                        ) : generation.review_status === 'approved' || generation.status === 'completed' ? (
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Ready
                          </Badge>
                        ) : (
                          <Badge variant={getStatusColor(generation.status)}>{generation.status}</Badge>
                        )}
                        {isAdCampaign && platformLabel && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">
                            {platformLabel}
                          </Badge>
                        )}
                        {isAdCampaign && objectiveLabel && (
                          <Badge variant="secondary" className="text-[10px]">{objectiveLabel}</Badge>
                        )}
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

                        {/* ── In-review status ── */}
                        {generation.review_status === 'pending_review' && (
                          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                            <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Under review</p>
                              <p className="text-amber-600 mt-0.5">Your request has been submitted for admin review. You will be notified when it's ready. No charge has been applied.</p>
                            </div>
                          </div>
                        )}

                        {/* ── Rejected status ── */}
                        {generation.review_status === 'rejected' && (
                          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                            <ShieldX className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Request rejected</p>
                              {generation.rejection_reason && (
                                <p className="text-red-600 mt-0.5">{generation.rejection_reason}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ── Completed: content + download ── */}
                        {generation.status === 'completed' && generation.review_status !== 'pending_review' && generation.review_status !== 'rejected' && (
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
