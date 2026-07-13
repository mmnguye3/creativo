import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Download, History, ExternalLink, Megaphone, Clock, ShieldX, CheckCircle2, Sparkles, Plus } from "lucide-react";
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

function HistorySkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#e6e9ee] shadow-[0_1px_3px_rgba(10,37,64,.06)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e6e9ee]">
        <div className="h-5 w-40 bg-[#e6e9ee] rounded animate-pulse mb-1" />
        <div className="h-3 w-32 bg-[#e6e9ee] rounded animate-pulse" />
      </div>
      <div className="p-5 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border border-[#e6e9ee] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-5 w-24 bg-[#e6e9ee] rounded-full animate-pulse" />
              <div className="h-5 w-16 bg-[#e6e9ee] rounded-full animate-pulse" />
              <div className="ml-auto h-3 w-20 bg-[#e6e9ee] rounded animate-pulse" />
            </div>
            <div className="h-3 w-full bg-[#e6e9ee] rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-[#e6e9ee] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

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
      toast({ title: "Error", description: "Failed to load generation history.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGenerations(); }, [user]);

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

  if (loading) return <HistorySkeleton />;

  return (
    <div className="bg-white rounded-xl border border-[#e6e9ee] shadow-[0_1px_3px_rgba(10,37,64,.06)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e6e9ee]">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-orange-500" />
          <h2 className="font-semibold text-[#0a2540]">Generation History</h2>
        </div>
        <p className="text-xs text-[#697386] mt-0.5">Your recent AI-generated content</p>
      </div>

      {generations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-orange-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#0a2540]">No generations yet</p>
            <p className="text-xs text-[#697386] mt-1 max-w-xs">Create your first AI-generated content using the AI Studio.</p>
          </div>
          {onViewAdCampaign === undefined && (
            <button className="flex items-center gap-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" /> Open AI Studio
            </button>
          )}
        </div>
      ) : (
        <ScrollArea className="h-[2100px]">
          <div className="p-5 space-y-3">
            {generations.map((generation) => {
              const isAdCampaign = generation.service_type === 'ad-campaign';
              const meta = generation.metadata || {};
              const platformLabel = PLATFORM_LABELS[meta.platform || ''];
              const objectiveLabel = OBJECTIVE_LABELS[meta.objective || ''];

              return (
                <div key={generation.id} className="border border-[#e6e9ee] rounded-xl p-4 space-y-3 hover:border-orange-200 hover:shadow-[0_2px_8px_rgba(10,37,64,.05)] transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isAdCampaign && <Megaphone className="h-4 w-4 text-orange-400 flex-shrink-0" />}
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#eef2f7] text-[#425466] border border-[#e6e9ee]">
                        {getServiceTypeLabel(generation.service_type)}
                      </span>
                      {generation.review_status === 'pending_review' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fef9c3] text-[#ca8a04]">
                          <Clock className="h-2.5 w-2.5" /> In review
                        </span>
                      ) : generation.review_status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fee2e2] text-[#ef4444]">
                          <ShieldX className="h-2.5 w-2.5" /> Rejected
                        </span>
                      ) : generation.review_status === 'approved' || generation.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#def7ec] text-[#0e9f6e]">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#eef2f7] text-[#697386]">
                          {generation.status}
                        </span>
                      )}
                      {isAdCampaign && platformLabel && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-500 border border-orange-100">
                          {platformLabel}
                        </span>
                      )}
                      {isAdCampaign && objectiveLabel && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#eef2f7] text-[#697386]">
                          {objectiveLabel}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#697386] shrink-0 font-medium">
                      {new Date(generation.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </span>
                  </div>

                  {isAdCampaign && (
                    <div className="flex items-center gap-3">
                      {generation.image_url && (
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#e6e9ee] flex-shrink-0">
                          <img src={generation.image_url} alt="Ad creative" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#425466] line-clamp-2">{generation.description}</p>
                      </div>
                      {onViewAdCampaign && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 text-orange-500 border-orange-200 hover:bg-orange-50 text-xs"
                          onClick={() => onViewAdCampaign(generation)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open
                        </Button>
                      )}
                    </div>
                  )}

                  {!isAdCampaign && (
                    <>
                      {(generation.client_email || generation.purchase_order_id) && (
                        <div className="text-xs text-[#697386] space-y-0.5 bg-[#f6f9fc] border border-[#e6e9ee] p-2.5 rounded-lg">
                          {generation.client_email && (
                            <div><span className="font-semibold text-[#425466]">Client:</span> {generation.client_email}</div>
                          )}
                          {generation.purchase_order_id && (
                            <div><span className="font-semibold text-[#425466]">PO:</span> {generation.purchase_order_id}</div>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-[#425466]">{generation.description}</p>

                      {generation.review_status === 'pending_review' && (
                        <div className="flex items-start gap-2 p-3 bg-[#fef9c3]/40 border border-[#fef9c3] rounded-xl text-xs text-[#ca8a04]">
                          <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Under review</p>
                            <p className="mt-0.5 opacity-80">Your request has been submitted for admin review. You will be notified when it's ready. No charge has been applied.</p>
                          </div>
                        </div>
                      )}

                      {generation.review_status === 'rejected' && (
                        <div className="flex items-start gap-2 p-3 bg-[#fee2e2]/40 border border-[#fee2e2] rounded-xl text-xs text-[#ef4444]">
                          <ShieldX className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Request rejected</p>
                            {generation.rejection_reason && (
                              <p className="mt-0.5 opacity-80">{generation.rejection_reason}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {generation.status === 'completed' && generation.review_status !== 'pending_review' && generation.review_status !== 'rejected' && (
                        <div className="flex flex-wrap gap-2">
                          {generation.generated_content && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-[#e6e9ee] text-[#425466] hover:bg-[#f6f9fc]"
                              onClick={() => copyToClipboard(generation.generated_content!)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy Text
                            </Button>
                          )}
                          {generation.image_url && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs border-[#e6e9ee] text-[#425466] hover:bg-[#f6f9fc]"
                                onClick={() => downloadImage(generation.image_url!, generation.id)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download Image
                              </Button>
                              <div className="w-full border border-[#e6e9ee] rounded-xl overflow-hidden">
                                <img src={generation.image_url} alt="Generated content" className="w-full h-32 object-cover" />
                              </div>
                            </>
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
    </div>
  );
};
