import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Check, RefreshCw, Megaphone, ImageIcon, Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  ContentAckGate,
  ContentGuidelinesPanel,
  ViolationErrorCard,
  parseModerationError,
  type ModerationError,
} from '@/components/ContentGuidelines';

interface AdBriefForm {
  platform: 'facebook-instagram' | 'google-ads' | 'tiktok';
  objective: 'conversions' | 'traffic' | 'brand-awareness' | 'lead-generation';
  description: string;
  targetAudience: string;
  tone: 'professional' | 'playful' | 'urgent-promo' | 'luxury' | 'bold';
  promoDetail: string;
}

interface AdPackage {
  headlines: string[];
  primaryTextShort: string;
  primaryTextLong: string;
  description: string;
  ctaButton: string;
  hashtags: string[];
  videoHooks: string[];
}

interface HistoryGeneration {
  id: string;
  generated_content: string | null;
  image_url: string | null;
  metadata?: Record<string, string> | null;
  description?: string;
}

interface AIAdsGeneratorProps {
  agencyName?: string;
  initialGeneration?: HistoryGeneration | null;
  onClear?: () => void;
}

const PLATFORMS = [
  { value: 'facebook-instagram', label: 'Facebook / Instagram', short: 'FB/IG' },
  { value: 'google-ads', label: 'Google Ads', short: 'Google' },
  { value: 'tiktok', label: 'TikTok', short: 'TikTok' },
] as const;

const OBJECTIVES = [
  { value: 'conversions', label: 'Conversions' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'brand-awareness', label: 'Brand Awareness' },
  { value: 'lead-generation', label: 'Lead Generation' },
] as const;

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'playful', label: 'Playful' },
  { value: 'urgent-promo', label: 'Urgent / Promo' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'bold', label: 'Bold' },
] as const;

const defaultForm: AdBriefForm = {
  platform: 'facebook-instagram',
  objective: 'conversions',
  description: '',
  targetAudience: '',
  tone: 'professional',
  promoDetail: '',
};

function parseAdPackage(raw: string | null): AdPackage | null {
  if (!raw) return null;
  try {
    const str = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(str);
    if (!parsed.headlines || !parsed.primaryTextShort) return null;
    return {
      headlines: Array.isArray(parsed.headlines) ? parsed.headlines : [],
      primaryTextShort: parsed.primaryTextShort || '',
      primaryTextLong: parsed.primaryTextLong || '',
      description: parsed.description || '',
      ctaButton: parsed.ctaButton || 'Learn More',
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      videoHooks: Array.isArray(parsed.videoHooks) ? parsed.videoHooks : [],
    };
  } catch {
    return null;
  }
}

function CharCount({ text, max }: { text: string; max: number }) {
  const len = text.length;
  const over = len > max;
  return (
    <span className={`text-[11px] ${over ? 'text-red-400' : 'text-zinc-500'}`}>
      {len}/{max}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function FacebookPreview({ adPackage, imageUrl, agencyName, activeHeadline }: {
  adPackage: AdPackage;
  imageUrl: string | null;
  agencyName: string;
  activeHeadline: number;
}) {
  const initial = agencyName.charAt(0).toUpperCase();
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden max-w-[380px] mx-auto text-black">
      <div className="flex items-center gap-2 p-3">
        <div className="w-9 h-9 rounded-full bg-orange-500 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">{agencyName}</div>
          <div className="text-[11px] text-gray-500">Sponsored · 🌐</div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
      <p className="px-3 pb-2 text-[13px] text-gray-900 leading-relaxed line-clamp-3">
        {adPackage.primaryTextShort || 'Your ad text will appear here.'}
      </p>
      <div className="w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt="Ad creative" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-14 h-14 text-gray-300" />
        )}
      </div>
      <div className="border-t bg-gray-50 px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider truncate">
            {adPackage.description || 'your-website.com'}
          </div>
          <div className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
            {adPackage.headlines[activeHeadline] || 'Your headline here'}
          </div>
        </div>
        <button className="flex-shrink-0 bg-[#1877F2] text-white text-xs font-semibold px-3 py-2 rounded">
          {adPackage.ctaButton || 'Learn More'}
        </button>
      </div>
      <div className="border-t px-3 py-2 flex items-center gap-4">
        <button className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-gray-700 font-medium">👍 Like</button>
        <button className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-gray-700 font-medium">💬 Comment</button>
        <button className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-gray-700 font-medium">↗ Share</button>
      </div>
    </div>
  );
}

function TikTokPreview({ adPackage, imageUrl, agencyName }: {
  adPackage: AdPackage;
  imageUrl: string | null;
  agencyName: string;
}) {
  const handle = '@' + agencyName.toLowerCase().replace(/\s+/g, '');
  return (
    <div className="relative bg-black rounded-xl border border-zinc-700 overflow-hidden max-w-[220px] mx-auto" style={{ aspectRatio: '9/16' }}>
      {imageUrl ? (
        <img src={imageUrl} alt="Ad creative" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-zinc-700" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute top-3 left-0 right-0 flex justify-between px-3">
        <span className="text-white text-xs font-semibold">Following</span>
        <span className="text-white text-xs font-semibold border-b border-white pb-0.5">For You</span>
        <span className="text-white text-xs font-semibold">Search</span>
      </div>
      <div className="absolute right-2 bottom-20 flex flex-col gap-3 items-center">
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-white" />
        </div>
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
          <Share2 className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-10 p-3">
        <div className="text-white text-[11px] font-bold mb-1">{handle}</div>
        <div className="text-white/90 text-[11px] leading-tight line-clamp-2">
          {adPackage.videoHooks[0] || 'Your video hook will appear here'}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide">AD</span>
          <button className="bg-white text-black text-[10px] font-semibold px-2.5 py-1 rounded-full">
            {adPackage.ctaButton || 'Learn More'}
          </button>
        </div>
      </div>
    </div>
  );
}

function GooglePreview({ adPackage, activeHeadline, setActiveHeadline }: {
  adPackage: AdPackage;
  activeHeadline: number;
  setActiveHeadline: (i: number) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 max-w-[400px] mx-auto text-black">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="border border-green-700 text-green-700 text-[10px] font-bold px-1 py-px rounded leading-none">Ad</span>
        <span className="text-xs text-gray-500">· www.youragency.com</span>
      </div>
      <div className="text-blue-700 text-[15px] font-medium leading-snug mb-1 hover:underline cursor-pointer">
        {adPackage.headlines.filter(Boolean).join(' | ') || 'Headline 1 | Headline 2 | Headline 3'}
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">
        {adPackage.primaryTextShort || 'Your ad description will appear here.'}{adPackage.description ? ` ${adPackage.description}` : ''}
      </p>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-1.5">Click a headline variant to preview:</p>
        <div className="flex flex-wrap gap-1.5">
          {adPackage.headlines.map((h, i) => (
            <button
              key={i}
              onClick={() => setActiveHeadline(i)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${activeHeadline === i ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
            >
              H{i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const AIAdsGenerator: React.FC<AIAdsGeneratorProps> = ({ agencyName = 'Your Agency', initialGeneration, onClear }) => {
  const [form, setForm] = useState<AdBriefForm>(defaultForm);
  const [adPackage, setAdPackage] = useState<AdPackage | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageModel, setImageModel] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeHeadline, setActiveHeadline] = useState(0);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const [violation, setViolation] = useState<ModerationError | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (initialGeneration) {
      const pkg = parseAdPackage(initialGeneration.generated_content);
      if (pkg) {
        setAdPackage(pkg);
        setImageUrl(initialGeneration.image_url);
        setGenerationId(initialGeneration.id);
        setSavedToHistory(true);
        const meta = initialGeneration.metadata || {};
        setForm(prev => ({
          ...prev,
          platform: (meta.platform as AdBriefForm['platform']) || 'facebook-instagram',
          objective: (meta.objective as AdBriefForm['objective']) || 'conversions',
          tone: (meta.tone as AdBriefForm['tone']) || 'professional',
          targetAudience: meta.targetAudience || '',
          promoDetail: meta.promoDetail || '',
          description: initialGeneration.description || '',
        }));
      }
    }
  }, [initialGeneration]);

  const updateForm = (key: keyof AdBriefForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!form.description.trim()) {
      toast({ title: 'Product/offer description is required', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Authentication required', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setAdPackage(null);
    setImageUrl(null);
    setImageModel(null);
    setSavedToHistory(false);
    setViolation(null);

    try {
      const { data: gen, error: insertError } = await supabase
        .from('ai_generations')
        .insert({
          user_id: user.id,
          service_type: 'ad-campaign',
          description: form.description,
          content_type: 'combo',
          status: 'pending',
          metadata: {
            platform: form.platform,
            objective: form.objective,
            tone: form.tone,
            targetAudience: form.targetAudience,
            promoDetail: form.promoDetail,
          },
        })
        .select()
        .single();

      if (insertError || !gen) throw new Error('Failed to create generation record');

      setGenerationId(gen.id);

      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          serviceType: 'ad-campaign',
          description: form.description,
          userId: user.id,
          generationId: gen.id,
          platform: form.platform,
          objective: form.objective,
          tone: form.tone,
          targetAudience: form.targetAudience,
          promoDetail: form.promoDetail,
        },
      });

      if (error) throw error;

      const pkg = parseAdPackage(data.generatedContent);
      if (!pkg) throw new Error('Failed to parse ad package from AI response');

      setAdPackage(pkg);
      setImageUrl(data.imageUrl);
      setImageModel(data.imageModel ?? null);
      setActiveHeadline(0);

      toast({ title: 'Ad campaign generated!', description: 'Review your ad package below.' });
    } catch (err: unknown) {
      const modError = await parseModerationError(err);
      if (modError) {
        setViolation(modError);
      } else {
        toast({
          title: 'Generation failed',
          description: (err as Error).message || 'Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!generationId) return;
    try {
      const { error } = await supabase
        .from('ai_generations')
        .update({ status: 'completed' })
        .eq('id', generationId);
      if (error) throw error;
      setSavedToHistory(true);
      toast({ title: 'Saved to history!' });
    } catch {
      toast({ title: 'Error saving to history', variant: 'destructive' });
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleClearAll = () => {
    setAdPackage(null);
    setImageUrl(null);
    setImageModel(null);
    setGenerationId('');
    setSavedToHistory(false);
    setForm(defaultForm);
    onClear?.();
  };

  const platformLabel = PLATFORMS.find(p => p.value === form.platform)?.label || 'Facebook / Instagram';
  const objectiveLabel = OBJECTIVES.find(o => o.value === form.objective)?.label || 'Conversions';

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-orange-500" />
        <div>
          <h2 className="font-bold text-white text-lg leading-none">AI Ad Generator</h2>
          <p className="text-zinc-400 text-xs mt-0.5">Generate complete ad campaigns with copy, creative, and CTAs</p>
        </div>
      </div>

      <ContentAckGate userId={user?.id}>
      <ContentGuidelinesPanel />

      {violation && (
        <ViolationErrorCard violation={violation} onDismiss={() => setViolation(null)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── LEFT: Brief Form ── */}
        <Card className="bg-white/[0.03] border-white/8">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white">Ad Brief</CardTitle>
            <CardDescription className="text-xs">Fill in the details for your campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Platform */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Platform</Label>
              <div className="flex gap-1.5 flex-wrap">
                {PLATFORMS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => updateForm('platform', p.value)}
                    className={`flex-1 min-w-[90px] text-xs py-2 px-3 rounded-md border font-medium transition-colors ${
                      form.platform === p.value
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-transparent border-white/15 text-zinc-400 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {p.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Objective */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Campaign Objective</Label>
              <Select value={form.objective} onValueChange={v => updateForm('objective', v)}>
                <SelectTrigger className="bg-white/5 border-white/15 text-white text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OBJECTIVES.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product / Offer */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">
                Product / Offer Description <span className="text-orange-400">*</span>
              </Label>
              <Textarea
                placeholder="e.g. Organic skincare serum with vitamin C, targets dryness and uneven skin tone"
                value={form.description}
                onChange={e => updateForm('description', e.target.value)}
                rows={3}
                className="bg-white/5 border-white/15 text-white placeholder:text-zinc-600 text-sm resize-none"
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Target Audience</Label>
              <Input
                placeholder="e.g. Women 25–40 interested in skincare"
                value={form.targetAudience}
                onChange={e => updateForm('targetAudience', e.target.value)}
                className="bg-white/5 border-white/15 text-white placeholder:text-zinc-600 text-sm h-9"
              />
            </div>

            {/* Tone */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Tone</Label>
              <Select value={form.tone} onValueChange={v => updateForm('tone', v)}>
                <SelectTrigger className="bg-white/5 border-white/15 text-white text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Promo Detail */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Promotional Detail <span className="text-zinc-600">(optional)</span></Label>
              <Input
                placeholder="e.g. 20% off first order, free shipping"
                value={form.promoDetail}
                onChange={e => updateForm('promoDetail', e.target.value)}
                className="bg-white/5 border-white/15 text-white placeholder:text-zinc-600 text-sm h-9"
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !form.description.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/20"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating campaign…
                </>
              ) : (
                <>
                  <Megaphone className="mr-2 h-4 w-4" />
                  Generate Ad Campaign
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ── RIGHT: Preview + Output ── */}
        <div className="space-y-4">
          {/* Loading skeleton */}
          {isGenerating && (
            <Card className="bg-white/[0.03] border-white/8">
              <CardContent className="pt-6 flex flex-col items-center justify-center gap-4 py-16">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                <div className="text-center">
                  <p className="text-white font-medium">Generating your ad campaign…</p>
                  <p className="text-zinc-500 text-sm mt-1">Writing copy and creating ad creative</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!isGenerating && !adPackage && (
            <Card className="bg-white/[0.03] border-white/8 border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <Megaphone className="h-12 w-12 text-zinc-700" />
                <p className="text-zinc-500 text-sm max-w-xs">
                  Fill out the brief on the left and click <strong className="text-zinc-400">Generate</strong> to create your ad campaign.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Generated output */}
          {!isGenerating && adPackage && (
            <>
              {/* Platform badges + model badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[11px]">{platformLabel}</Badge>
                <Badge variant="outline" className="border-white/15 text-zinc-400 text-[11px]">{objectiveLabel}</Badge>
                {savedToHistory && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[11px]">
                    <Check className="w-3 h-3 mr-1" /> Saved
                  </Badge>
                )}
              </div>

              {/* Platform preview */}
              <Card className="bg-white/[0.03] border-white/8 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ad Preview</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  {form.platform === 'facebook-instagram' && (
                    <FacebookPreview
                      adPackage={adPackage}
                      imageUrl={imageUrl}
                      agencyName={agencyName}
                      activeHeadline={activeHeadline}
                    />
                  )}
                  {form.platform === 'tiktok' && (
                    <TikTokPreview
                      adPackage={adPackage}
                      imageUrl={imageUrl}
                      agencyName={agencyName}
                    />
                  )}
                  {form.platform === 'google-ads' && (
                    <GooglePreview
                      adPackage={adPackage}
                      activeHeadline={activeHeadline}
                      setActiveHeadline={setActiveHeadline}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Headlines – clickable to swap */}
              <Card className="bg-white/[0.03] border-white/8">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Headlines <span className="normal-case font-normal text-zinc-600">– click to swap into preview</span></CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {adPackage.headlines.map((h, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveHeadline(i)}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        activeHeadline === i
                          ? 'border-orange-500/60 bg-orange-500/10'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] font-bold shrink-0 ${activeHeadline === i ? 'text-orange-400' : 'text-zinc-600'}`}>H{i + 1}</span>
                        <span className="text-sm text-white truncate">{h}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <CharCount text={h} max={40} />
                        <CopyButton text={h} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* All ad fields */}
              <Card className="bg-white/[0.03] border-white/8">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ad Copy Fields</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Primary Text Short */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Primary Text (Short)</span>
                      <div className="flex items-center gap-1">
                        <CharCount text={adPackage.primaryTextShort} max={125} />
                        <CopyButton text={adPackage.primaryTextShort} />
                      </div>
                    </div>
                    <p className="text-sm text-white/90 bg-white/5 rounded-md px-3 py-2 leading-relaxed">
                      {adPackage.primaryTextShort}
                    </p>
                  </div>

                  {/* Primary Text Long */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Primary Text (Long)</span>
                      <CopyButton text={adPackage.primaryTextLong} />
                    </div>
                    <p className="text-sm text-white/90 bg-white/5 rounded-md px-3 py-2 leading-relaxed">
                      {adPackage.primaryTextLong}
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Description</span>
                      <div className="flex items-center gap-1">
                        <CharCount text={adPackage.description} max={30} />
                        <CopyButton text={adPackage.description} />
                      </div>
                    </div>
                    <p className="text-sm text-white/90 bg-white/5 rounded-md px-3 py-2">{adPackage.description}</p>
                  </div>

                  {/* CTA Button */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">CTA Button</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white bg-orange-500/20 border border-orange-500/30 rounded-md px-3 py-1.5 font-medium text-orange-300">
                        {adPackage.ctaButton}
                      </span>
                      <CopyButton text={adPackage.ctaButton} />
                    </div>
                  </div>

                  {/* Hashtags */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Hashtags</span>
                      <CopyButton text={adPackage.hashtags.join(' ')} />
                    </div>
                    <div className="flex flex-wrap gap-1.5 bg-white/5 rounded-md px-3 py-2">
                      {adPackage.hashtags.map((tag, i) => (
                        <span key={i} className="text-xs text-blue-400">{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Video Hooks */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Video Hooks</span>
                    <div className="space-y-1.5">
                      {adPackage.videoHooks.map((hook, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 bg-white/5 rounded-md px-3 py-2">
                          <span className="text-xs text-zinc-500 shrink-0">#{i + 1}</span>
                          <span className="text-sm text-white/90 flex-1">{hook}</span>
                          <CopyButton text={hook} />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="flex-1 border-white/15 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
                {!savedToHistory ? (
                  <Button
                    onClick={handleSaveToHistory}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white border-0"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Save to History
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleClearAll}
                    className="flex-1 border-white/15 text-zinc-400 hover:bg-white/10"
                  >
                    New Campaign
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      </ContentAckGate>
    </div>
  );
};
