import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ContentAckGate,
  ContentGuidelinesPanel,
  ViolationErrorCard,
  parseModerationError,
  type ModerationError,
} from '@/components/ContentGuidelines';
import {
  SERVICES, SERVICE_FAMILIES, getService, getServicesByFamily,
  type ServiceFamily, type ServiceDef, type ServiceField,
} from '@/lib/serviceCatalog';
import {
  Sparkles, Download, RefreshCw, Pencil, BookmarkCheck, ShieldCheck,
  ChevronRight, AlertTriangle, Image as ImageIcon, FileText, Loader2,
  CheckCircle2, Clock,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'screening' | 'generating' | 'checking' | 'ready' | 'blocked' | 'error';
type MobileTab = 'service' | 'brief' | 'output';

interface GenResult {
  generatedContent: string | null;
  imageUrl:         string | null;
  imageModel:       string | null;
  contentType:      string | null;
  pendingReview?:   boolean;
}

interface RecentGen {
  id:                string;
  service_type:      string;
  description:       string;
  image_url:         string | null;
  image_model:       string | null;
  generated_content: string | null;
  created_at:        string;
  metadata:          Record<string, string> | null;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function downloadBlob(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  a.click();
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  downloadBlob(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function serviceLabel(id: string) {
  return getService(id)?.label ?? id;
}

// ─── ChipGroup ────────────────────────────────────────────────────────────────

function ChipGroup({
  options, value, onChange,
}: {
  options: { value: string; label: string }[];
  value:   string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(value === o.value ? '' : o.value)}
          data-testid={`chip-${o.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
            value === o.value
              ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
              : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300 hover:text-orange-600'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── ToggleGroup ──────────────────────────────────────────────────────────────

function ToggleGroup({
  options, value, onChange,
}: {
  options: { value: string; label: string }[];
  value:   string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 p-1 bg-stone-100 rounded-xl w-fit">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          data-testid={`toggle-${o.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            value === o.value
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── BriefField ───────────────────────────────────────────────────────────────

function BriefField({
  field, value, onChange,
}: {
  field:    ServiceField;
  value:    string;
  onChange: (id: string, v: string) => void;
}) {
  const chars = value.length;
  const max   = field.maxChars;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-stone-700">
          {field.label}
          {field.required && <span className="text-orange-500 ml-0.5">*</span>}
          {field.optional && <span className="text-stone-400 ml-1 font-normal">(optional)</span>}
        </label>
        {max && field.type !== 'chips' && field.type !== 'toggle' && (
          <span className={`text-[10px] tabular-nums ${chars > max * 0.9 ? 'text-orange-500' : 'text-stone-400'}`}>
            {chars}/{max}
          </span>
        )}
      </div>

      {field.type === 'text' && (
        <input
          type="text"
          value={value}
          placeholder={field.placeholder}
          maxLength={field.maxChars}
          data-testid={`input-${field.id}`}
          onChange={e => onChange(field.id, e.target.value)}
          className="w-full h-9 px-3 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition"
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          value={value}
          placeholder={field.placeholder}
          maxLength={field.maxChars}
          rows={3}
          data-testid={`textarea-${field.id}`}
          onChange={e => onChange(field.id, e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 resize-none transition"
        />
      )}

      {field.type === 'chips' && field.options && (
        <ChipGroup
          options={field.options}
          value={value}
          onChange={v => onChange(field.id, v)}
        />
      )}

      {field.type === 'toggle' && field.options && (
        <ToggleGroup
          options={field.options}
          value={value || field.options[0].value}
          onChange={v => onChange(field.id, v)}
        />
      )}
    </div>
  );
}

// ─── LiveBriefCard ────────────────────────────────────────────────────────────

function LiveBriefCard({ brief }: { brief: string }) {
  const isEmpty = brief === 'Fill in the brief below';
  return (
    <div className={`rounded-xl p-3 border transition-colors ${
      isEmpty ? 'bg-stone-50 border-stone-100' : 'bg-orange-50 border-orange-100'
    }`}>
      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Live brief preview</p>
      <p className={`text-sm leading-relaxed ${isEmpty ? 'text-stone-400 italic' : 'text-stone-700'}`}>
        {brief}
      </p>
    </div>
  );
}

// ─── OutputTypeBadge ──────────────────────────────────────────────────────────

function OutputTypeBadge({ service }: { service: ServiceDef }) {
  const isText = service.falModel === 'text-only';
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-100">
      <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${isText ? 'bg-blue-100' : 'bg-purple-100'}`}>
        {isText ? <FileText className="w-3.5 h-3.5 text-blue-600" /> : <ImageIcon className="w-3.5 h-3.5 text-purple-600" />}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-stone-200 text-stone-500 font-normal capitalize">
            {service.contentType}
          </Badge>
        </div>
        <p className="text-[11px] text-stone-500 mt-0.5">{service.modelReason}</p>
      </div>
    </div>
  );
}

// ─── PipelineStrip ────────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { key: 'screening',  label: 'Brief screened'   },
  { key: 'generating', label: 'Generating'        },
  { key: 'checking',   label: 'Quality check'     },
  { key: 'ready',      label: 'Ready'             },
] as const;

const PHASE_STEP: Record<Phase, number> = {
  idle: -1, screening: 0, generating: 1, checking: 2, ready: 3, blocked: 0, error: 0,
};

function PipelineStrip({ phase }: { phase: Phase }) {
  if (phase === 'idle') return null;
  const currentStep = PHASE_STEP[phase];
  const isBlocked   = phase === 'blocked' || phase === 'error';

  return (
    <div className="flex items-center gap-1 mb-5">
      {PIPELINE_STEPS.map((step, i) => {
        const done    = !isBlocked && currentStep > i;
        const active  = !isBlocked && currentStep === i;
        const blocked = isBlocked && i === 0;

        return (
          <React.Fragment key={step.key}>
            <div className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                blocked ? 'bg-red-100' :
                done    ? 'bg-green-100' :
                active  ? 'bg-orange-100 ring-2 ring-orange-400/30' :
                          'bg-stone-100'
              }`}>
                {blocked && i === 0 ? (
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                ) : done ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                ) : active ? (
                  <Loader2 className="w-3 h-3 text-orange-500 animate-spin" />
                ) : (
                  <Clock className="w-3 h-3 text-stone-300" />
                )}
              </div>
              <span className={`text-[11px] font-bold whitespace-nowrap ${
                blocked && i === 0 ? 'text-red-700' :
                done               ? 'text-green-700' :
                active             ? 'text-orange-600' :
                                     'text-black'
              }`}>
                {step.label}
              </span>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className={`flex-1 h-px min-w-[8px] mx-1 transition-colors ${done ? 'bg-green-300' : 'bg-stone-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── SocialAdFrame ────────────────────────────────────────────────────────────

function SocialAdFrame({
  imageUrl, platform, adData, brandName,
}: {
  imageUrl:  string;
  platform:  string;
  adData:    { headline?: string; body?: string; cta?: string };
  brandName: string;
}) {
  const isTikTok   = platform === 'TikTok' || platform === 'YouTube Shorts';
  const isGoogle   = platform === 'Google Display';
  const isVertical = isTikTok;

  if (isGoogle) {
    return (
      <div className="rounded-xl border border-stone-200 overflow-hidden bg-white max-w-md mx-auto">
        <div className="flex items-center px-2 py-1 bg-stone-50 border-b border-stone-100">
          <span className="text-[9px] border border-stone-300 text-stone-500 rounded px-1 mr-2">Ad</span>
          <span className="text-[10px] text-stone-500 truncate">{brandName || 'Your Brand'}</span>
        </div>
        <img src={imageUrl} alt="Generated ad" className="w-full object-cover max-h-[200px]" />
        {adData.headline && (
          <div className="px-3 py-2 border-t border-stone-100">
            <p className="text-xs font-semibold text-stone-800 truncate">{adData.headline}</p>
            {adData.cta && <p className="text-[10px] text-blue-600 mt-0.5">{adData.cta} →</p>}
          </div>
        )}
      </div>
    );
  }

  if (isTikTok) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-black max-w-[260px] mx-auto" style={{ aspectRatio: '9/16' }}>
        <img src={imageUrl} alt="Generated ad" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-3 right-3">
          {adData.headline && (
            <p className="text-white text-sm font-semibold leading-snug mb-1">{adData.headline}</p>
          )}
          {adData.body && (
            <p className="text-white/80 text-[11px] line-clamp-2">{adData.body}</p>
          )}
          {adData.cta && (
            <div className="mt-2 inline-block bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="text-white text-[11px] font-semibold">{adData.cta}</span>
            </div>
          )}
        </div>
        <div className="absolute top-3 left-3">
          <span className="text-[9px] bg-white/20 backdrop-blur-sm text-white rounded px-1.5 py-0.5 font-medium">Sponsored</span>
        </div>
      </div>
    );
  }

  // Facebook / Instagram / Pinterest / LinkedIn / Twitter/X default
  return (
    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden max-w-sm mx-auto shadow-sm">
      <div className="flex items-center gap-2 p-3 border-b border-stone-100">
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">{(brandName || 'B')[0].toUpperCase()}</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-stone-800 leading-tight">{brandName || 'Your Brand'}</p>
          <p className="text-[10px] text-stone-400">Sponsored · {platform}</p>
        </div>
      </div>
      <img src={imageUrl} alt="Generated ad" className="w-full object-cover max-h-[300px]" />
      {(adData.headline || adData.body) && (
        <div className="p-3 border-t border-stone-100">
          {adData.headline && <p className="text-sm font-semibold text-stone-800">{adData.headline}</p>}
          {adData.body     && <p className="text-xs text-stone-600 mt-0.5 line-clamp-2">{adData.body}</p>}
        </div>
      )}
      {adData.cta && (
        <div className="px-3 pb-3">
          <div className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold py-2 px-4 rounded-lg text-center">
            {adData.cta}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TextOutput ───────────────────────────────────────────────────────────────

function TextOutput({ content }: { content: string }) {
  const lines = content.split('\n').filter(l => l.trim());
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50 p-4 max-h-[500px] overflow-y-auto">
      {lines.map((line, i) => {
        if (line.startsWith('# '))  return <h2 key={i} className="text-lg font-bold text-stone-900 mb-2 mt-3">{line.slice(2)}</h2>;
        if (line.startsWith('## ')) return <h3 key={i} className="text-base font-semibold text-stone-800 mb-1 mt-3">{line.slice(3)}</h3>;
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="text-sm font-semibold text-stone-800 mb-1">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <li key={i} className="text-sm text-stone-700 mb-1 ml-4 list-disc">{line.slice(2)}</li>;
        }
        return <p key={i} className="text-sm text-stone-700 mb-2 leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

// ─── OutputArea ───────────────────────────────────────────────────────────────

function OutputArea({
  phase, result, violation, service, values, onDismissViolation, onTweakBrief, onRegenerate,
}: {
  phase:               Phase;
  result:              GenResult | null;
  violation:           ModerationError | null;
  service:             ServiceDef | null;
  values:              Record<string, string>;
  onDismissViolation:  () => void;
  onTweakBrief:        () => void;
  onRegenerate:        () => void;
}) {
  const { toast } = useToast();

  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7 text-orange-400" />
        </div>
        <p className="font-semibold text-stone-600 mb-1">Your generation will appear here</p>
        <p className="text-sm text-stone-400">Pick a service and build your brief to get started</p>
      </div>
    );
  }

  if (phase === 'blocked' && violation) {
    return (
      <ViolationErrorCard
        violation={violation}
        onDismiss={onDismissViolation}
      />
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <p className="font-semibold text-stone-700 mb-1">Generation failed</p>
        <p className="text-sm text-stone-400 mb-4">Something went wrong. Please try again.</p>
        <Button size="sm" onClick={onRegenerate} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
          Try again
        </Button>
      </div>
    );
  }

  if (!result && (phase === 'screening' || phase === 'generating' || phase === 'checking')) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
          <Loader2 className="w-7 h-7 text-orange-400 animate-spin" />
        </div>
        <p className="font-semibold text-stone-600 mb-1">
          {phase === 'screening'  ? 'Checking your brief…' :
           phase === 'generating' ? 'Generating your asset…' :
                                    'Running quality checks…'}
        </p>
        <p className="text-sm text-stone-400">This usually takes 10–30 seconds</p>
      </div>
    );
  }

  if (!result) return null;

  const isAdCampaign = service?.id === 'ad-campaign';
  const platform     = values.platform || 'Instagram';
  const brandName    = values.brandName || 'Your Brand';

  let adData: { headline?: string; body?: string; cta?: string } = {};
  if (isAdCampaign && result.generatedContent) {
    try {
      const raw  = result.generatedContent.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
      adData     = JSON.parse(raw);
    } catch {
      adData.body = result.generatedContent;
    }
  }

  const handleDownload = () => {
    if (result.imageUrl) {
      downloadBlob(result.imageUrl, `cretivo-${service?.id || 'asset'}-${Date.now()}.png`);
    } else if (result.generatedContent) {
      downloadText(result.generatedContent, `cretivo-${service?.id || 'content'}-${Date.now()}.txt`);
      toast({ title: 'Downloaded', description: 'Content saved as a text file.' });
    }
  };

  const handleCopyText = () => {
    if (result.generatedContent) {
      navigator.clipboard.writeText(result.generatedContent);
      toast({ title: 'Copied to clipboard!' });
    }
  };

  return (
    <div className="space-y-4">
      {result.pendingReview && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">This asset is under brand/IP review and may take a moment to clear.</p>
        </div>
      )}

      {/* Image output */}
      {result.imageUrl && (
        <div>
          {isAdCampaign ? (
            <SocialAdFrame
              imageUrl={result.imageUrl}
              platform={platform}
              adData={adData}
              brandName={brandName}
            />
          ) : (
            <div className="rounded-2xl overflow-hidden border border-stone-100 shadow-sm">
              <img
                src={result.imageUrl}
                alt="Generated asset"
                className="w-full object-contain max-h-[480px] bg-stone-50"
              />
            </div>
          )}
          {result.imageModel && (
            <p className="text-[10px] text-stone-400 text-center mt-1.5">
              Generated with <span className="font-medium">{result.imageModel}</span>
            </p>
          )}
        </div>
      )}

      {/* Text output (non-ad combo or text-only) */}
      {result.generatedContent && !isAdCampaign && (
        <TextOutput content={result.generatedContent} />
      )}

      {/* Ad copy shown separately */}
      {isAdCampaign && result.generatedContent && !result.imageUrl && (
        <TextOutput content={result.generatedContent} />
      )}

      {/* Action row */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <Button
          onClick={handleDownload}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold gap-1.5"
          data-testid="btn-download"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </Button>
        {result.generatedContent && (
          <Button
            onClick={handleCopyText}
            variant="outline"
            className="rounded-xl text-sm border-stone-200 text-stone-700 gap-1.5"
            data-testid="btn-copy"
          >
            <FileText className="w-3.5 h-3.5" />
            Copy text
          </Button>
        )}
        <Button
          onClick={onRegenerate}
          variant="outline"
          className="rounded-xl text-sm border-stone-200 text-stone-700 gap-1.5"
          data-testid="btn-regenerate"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate
        </Button>
        <Button
          onClick={onTweakBrief}
          variant="outline"
          className="rounded-xl text-sm border-stone-200 text-stone-700 gap-1.5"
          data-testid="btn-tweak"
        >
          <Pencil className="w-3.5 h-3.5" />
          Tweak brief
        </Button>
        <Button
          variant="ghost"
          className="rounded-xl text-sm text-stone-500 gap-1.5"
          data-testid="btn-saved"
          disabled
        >
          <BookmarkCheck className="w-3.5 h-3.5" />
          Saved
        </Button>
      </div>
    </div>
  );
}

// ─── RecentWorkCarousel ───────────────────────────────────────────────────────

function RecentWorkCarousel({
  gens, onLoad,
}: {
  gens:   RecentGen[];
  onLoad: (gen: RecentGen) => void;
}) {
  if (gens.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-stone-800 mb-3">Recent work</h3>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {gens.map(g => {
          const svc = getService(g.service_type);
          return (
            <button
              key={g.id}
              onClick={() => onLoad(g)}
              data-testid={`recent-card-${g.id}`}
              className="shrink-0 w-36 rounded-xl border border-stone-100 overflow-hidden hover:border-orange-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="h-24 bg-stone-100 relative overflow-hidden">
                {g.image_url ? (
                  <img src={g.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl">{svc?.emoji || '📄'}</span>
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-[11px] font-semibold text-stone-800 truncate">{svc?.label || g.service_type}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">{fmtDate(g.created_at)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── StepHeader ──────────────────────────────────────────────────────────────

function StepHeader({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">{n}</span>
      <span className="text-sm font-semibold text-stone-800">{title}</span>
    </div>
  );
}

// ─── Main AIStudio ────────────────────────────────────────────────────────────

export function AIStudio() {
  const { user }    = useAuth();
  const { toast }   = useToast();

  const [family,      setFamily]      = useState<ServiceFamily>('social-ads');
  const [serviceId,   setServiceId]   = useState('ad-campaign');
  const [values,      setValues]      = useState<Record<string, string>>({});
  const [phase,       setPhase]       = useState<Phase>('idle');
  const [genResult,   setGenResult]   = useState<GenResult | null>(null);
  const [violation,   setViolation]   = useState<ModerationError | null>(null);
  const [recentGens,  setRecentGens]  = useState<RecentGen[]>([]);
  const [mobileTab,   setMobileTab]   = useState<MobileTab>('service');
  const [showGuidelines, setShowGuidelines] = useState(false);

  const phaseTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const service = getService(serviceId);

  // ── Fetch recent generations ──────────────────────────────────────────────
  const fetchRecent = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('ai_generations')
      .select('id, service_type, description, image_url, image_model, generated_content, created_at, metadata')
      .eq('user_id', user.id)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(8);
    if (data) setRecentGens(data as RecentGen[]);
  }, [user]);

  useEffect(() => { fetchRecent(); }, [fetchRecent]);

  // ── Clear phase timers on unmount ─────────────────────────────────────────
  useEffect(() => () => { phaseTimers.current.forEach(clearTimeout); }, []);

  // ── Field change ──────────────────────────────────────────────────────────
  const setField = (id: string, v: string) => setValues(prev => ({ ...prev, [id]: v }));

  // ── Select service ────────────────────────────────────────────────────────
  const selectService = (id: string) => {
    const svc = getService(id);
    if (!svc) return;
    if (id !== serviceId) setValues({});
    setServiceId(id);
    setFamily(svc.family);
    setPhase('idle');
    setGenResult(null);
    setViolation(null);
    setMobileTab('brief');
  };

  // ── Validate required fields ──────────────────────────────────────────────
  const validate = (): boolean => {
    if (!service) return false;
    const missing = service.fields
      .filter(f => f.required && !values[f.id]?.trim())
      .map(f => f.label);
    if (missing.length > 0) {
      toast({
        title:       'Fill in required fields',
        description: missing.join(', '),
        variant:     'destructive',
      });
      return false;
    }
    return true;
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!user || !service) return;
    if (!validate()) return;

    // Clear previous
    phaseTimers.current.forEach(clearTimeout);
    phaseTimers.current = [];
    setGenResult(null);
    setViolation(null);
    setPhase('screening');
    setMobileTab('output');

    // Phase animation timers
    phaseTimers.current.push(setTimeout(() => setPhase('generating'), 1600));
    phaseTimers.current.push(setTimeout(() => setPhase('checking'),   5500));

    try {
      const edgeParams   = service.buildEdgeParams(values);
      const assembledDesc = edgeParams.description || values.description || '';

      // Create DB record
      const { data: genRow, error: insertErr } = await supabase
        .from('ai_generations')
        .insert({
          user_id:     user.id,
          service_type: service.id,
          description: assembledDesc.slice(0, 2000),
          status:      'pending',
          metadata:    values as Record<string, string>,
        })
        .select('id')
        .single();

      if (insertErr || !genRow?.id) {
        throw new Error(insertErr?.message || 'Failed to create generation record');
      }

      const genId = genRow.id;

      // Call edge function
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: { serviceType: service.id, generationId: genId, ...edgeParams },
      });

      phaseTimers.current.forEach(clearTimeout);
      phaseTimers.current = [];

      if (error) {
        const modErr = await parseModerationError(error);
        if (modErr) {
          setViolation(modErr as ModerationError);
          setPhase('blocked');
        } else {
          setPhase('error');
          toast({
            title:       'Generation failed',
            description: error.message || 'Unexpected error — please try again.',
            variant:     'destructive',
          });
        }
        return;
      }

      if (data?.error === 'CONTENT_VIOLATION') {
        setViolation({ error: 'CONTENT_VIOLATION', category: data.category, message: data.message });
        setPhase('blocked');
        return;
      }

      setGenResult({
        generatedContent: data?.generatedContent ?? null,
        imageUrl:         data?.imageUrl          ?? null,
        imageModel:       data?.imageModel        ?? null,
        contentType:      data?.contentType       ?? null,
        pendingReview:    data?.pendingReview      ?? false,
      });
      setPhase('ready');
      fetchRecent();

    } catch (err: unknown) {
      phaseTimers.current.forEach(clearTimeout);
      phaseTimers.current = [];
      const modErr = await parseModerationError(err);
      if (modErr) {
        setViolation(modErr as ModerationError);
        setPhase('blocked');
      } else {
        setPhase('error');
        toast({
          title:       'Generation failed',
          description: (err as Error).message || 'Unexpected error — please try again.',
          variant:     'destructive',
        });
      }
    }
  };

  // ── Load past generation ──────────────────────────────────────────────────
  const loadRecentGen = (gen: RecentGen) => {
    const svc = getService(gen.service_type);
    if (!svc) return;
    setServiceId(gen.service_type);
    setFamily(svc.family);
    if (gen.metadata && typeof gen.metadata === 'object') {
      setValues(gen.metadata as Record<string, string>);
    } else {
      setValues({ description: gen.description || '' });
    }
    setPhase('idle');
    setGenResult(null);
    setViolation(null);
    setMobileTab('brief');
    toast({ title: 'Brief loaded', description: `${svc.label} brief ready to tweak` });
  };

  const handleTweakBrief = () => {
    setPhase('idle');
    setGenResult(null);
    setViolation(null);
    setMobileTab('brief');
  };

  const brief = service ? service.buildBrief(values) : 'Select a service to get started';

  const isGenerating = phase === 'screening' || phase === 'generating' || phase === 'checking';
  const servicesInFamily = getServicesByFamily(family);

  // ── Sub-panel: service picker ─────────────────────────────────────────────
  const ServicePickerPanel = (
    <div className="space-y-4">
      {/* Family pills */}
      <div className="flex flex-wrap gap-1.5">
        {SERVICE_FAMILIES.map(f => (
          <button
            key={f.id}
            onClick={() => setFamily(f.id)}
            data-testid={`family-pill-${f.id}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              family === f.id
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
            }`}
          >
            <span>{f.emoji}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>
      {/* Service cards */}
      <div className="grid grid-cols-3 gap-2">
        {servicesInFamily.map(svc => (
          <button
            key={svc.id}
            onClick={() => selectService(svc.id)}
            data-testid={`service-card-${svc.id}`}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
              serviceId === svc.id
                ? 'border-orange-400 bg-orange-50 shadow-sm shadow-orange-100'
                : 'border-stone-100 bg-white hover:border-orange-200 hover:bg-orange-50/50'
            }`}
          >
            <span className="text-2xl">{svc.emoji}</span>
            <span className={`text-[10px] font-semibold leading-tight ${serviceId === svc.id ? 'text-orange-700' : 'text-stone-700'}`}>
              {svc.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Sub-panel: brief form ─────────────────────────────────────────────────
  const BriefFormPanel = service && (
    <div className="space-y-4">
      {service.fields.map(field => (
        <BriefField
          key={field.id}
          field={field}
          value={values[field.id] || ''}
          onChange={setField}
        />
      ))}
      <LiveBriefCard brief={brief} />
    </div>
  );

  // ── Sub-panel: generate row ───────────────────────────────────────────────
  const GeneratePanel = service && (
    <div className="space-y-3">
      <OutputTypeBadge service={service} />
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        data-testid="btn-generate"
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-11 text-sm gap-2 shadow-lg shadow-orange-500/25 transition-all"
      >
        {isGenerating ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
        ) : (
          <><Sparkles className="w-4 h-4" />Generate</>
        )}
      </Button>
    </div>
  );

  // ── Guidelines chip ───────────────────────────────────────────────────────
  const GuidelinesChip = (
    <button
      onClick={() => setShowGuidelines(true)}
      data-testid="btn-guidelines"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-green-200 bg-green-50 hover:bg-green-100 transition text-xs font-semibold text-green-700"
    >
      <span className="w-2 h-2 rounded-full bg-green-500" />
      <ShieldCheck className="w-3 h-3" />
      Guidelines · All checks active
    </button>
  );

  return (
    <ContentAckGate userId={user?.id}>
      {showGuidelines && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowGuidelines(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <ContentGuidelinesPanel />
            <Button onClick={() => setShowGuidelines(false)} className="mt-4 w-full rounded-xl bg-stone-900 hover:bg-stone-800 text-white">Close</Button>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              AI Studio
            </h2>
            <p className="text-sm text-zinc-400 mt-0.5">Pick a service, build your brief, and generate.</p>
          </div>
          {GuidelinesChip}
        </div>

        {/* ── Mobile tabs ── */}
        <div className="md:hidden flex gap-1 p-1 bg-stone-100 rounded-xl">
          {(['service', 'brief', 'output'] as MobileTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              data-testid={`mobile-tab-${tab}`}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                mobileTab === tab ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              {tab === 'service' ? '1 · Service' : tab === 'brief' ? '2 · Brief' : '3 · Output'}
            </button>
          ))}
        </div>

        {/* ── Desktop: two panels ── */}
        <div className="hidden md:flex gap-5 items-start">
          {/* Left panel */}
          <div className="w-[420px] flex-shrink-0 space-y-4">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <StepHeader n="1" title="Pick a service" />
              {ServicePickerPanel}
            </div>

            {service && (
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
                <StepHeader n="2" title="Build the brief" />
                {BriefFormPanel}
              </div>
            )}

            {service && (
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
                <StepHeader n="3" title="Generate" />
                {GeneratePanel}
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="flex-1 bg-white rounded-2xl border border-stone-100 shadow-sm p-5 min-h-[520px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-stone-800">Output Studio</h3>
              {phase !== 'idle' && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  phase === 'ready'   ? 'bg-green-100 text-green-700' :
                  phase === 'blocked' ? 'bg-red-100 text-red-700' :
                  phase === 'error'   ? 'bg-red-100 text-red-700' :
                                        'bg-orange-100 text-orange-700'
                }`}>
                  {phase === 'ready' ? '✓ Ready' : phase === 'blocked' ? '✗ Blocked' : phase === 'error' ? '✗ Error' : '● Working…'}
                </span>
              )}
            </div>
            <PipelineStrip phase={phase} />
            <OutputArea
              phase={phase}
              result={genResult}
              violation={violation}
              service={service || null}
              values={values}
              onDismissViolation={() => { setViolation(null); setPhase('idle'); }}
              onTweakBrief={handleTweakBrief}
              onRegenerate={handleGenerate}
            />
          </div>
        </div>

        {/* ── Mobile: wizard tabs ── */}
        <div className="md:hidden">
          {mobileTab === 'service' && (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
              {ServicePickerPanel}
              {service && (
                <Button
                  onClick={() => setMobileTab('brief')}
                  className="w-full mt-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl gap-1"
                >
                  Build the brief <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {mobileTab === 'brief' && service && (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 pb-28">
              <div className="space-y-4">
                {BriefFormPanel}
              </div>
            </div>
          )}

          {mobileTab === 'output' && (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
              <PipelineStrip phase={phase} />
              <OutputArea
                phase={phase}
                result={genResult}
                violation={violation}
                service={service || null}
                values={values}
                onDismissViolation={() => { setViolation(null); setPhase('idle'); setMobileTab('brief'); }}
                onTweakBrief={handleTweakBrief}
                onRegenerate={handleGenerate}
              />
            </div>
          )}

          {/* Sticky generate bar (brief tab) */}
          {mobileTab === 'brief' && service && (
            <div className="fixed bottom-16 left-0 right-0 z-30 px-4 py-3 bg-white border-t border-stone-100 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-stone-500 truncate">{service.modelReason}</p>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  data-testid="btn-generate-mobile"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl gap-2 shrink-0 shadow-lg shadow-orange-500/25"
                >
                  {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />…</> : <><Sparkles className="w-4 h-4" />Generate</>}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Recent work ── */}
        <RecentWorkCarousel gens={recentGens} onLoad={loadRecentGen} />
      </div>
    </ContentAckGate>
  );
}
