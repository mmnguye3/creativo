import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle2, ImageOff, KeyRound, Wallet, Wrench, ChevronDown, ChevronUp } from 'lucide-react';

interface FallbackGen {
  id: string;
  service_type: string;
  image_model: string | null;
  image_fallback_error: string | null;
  created_at: string | null;
}

interface FallbackStats {
  totalWithImages: number;
  fallbackCount: number;
  lastError: string | null;
  lastErrorAt: string | null;
  recent: FallbackGen[];
}

function classifyError(err: string | null): { label: string; hint: string; icon: React.ElementType } {
  const e = (err || '').toLowerCase();
  if (e.includes('401')) {
    return { label: 'Authentication error', hint: 'The fal.ai API key is invalid or revoked — regenerate the key in the fal.ai dashboard and update the FAL_KEY secret.', icon: KeyRound };
  }
  if (e.includes('403') || e.includes('exhausted') || e.includes('balance')) {
    return { label: 'Balance exhausted', hint: 'The fal.ai account is out of credit — top up the balance at fal.ai.', icon: Wallet };
  }
  if (e.includes('422')) {
    return { label: 'Parameter error', hint: 'fal.ai rejected the request parameters — the model API may have changed. Check the error detail below.', icon: Wrench };
  }
  if (e.includes('fal_key not configured')) {
    return { label: 'Key not configured', hint: 'FAL_KEY is not set in the edge function secrets.', icon: KeyRound };
  }
  return { label: 'Generation error', hint: 'fal.ai failed for another reason — see the error detail below.', icon: AlertTriangle };
}

export default function ImageFallbackAlert() {
  const [stats, setStats] = useState<FallbackStats | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from('ai_generations')
          .select('id, service_type, image_model, image_fallback_error, created_at')
          .not('image_model', 'is', null)
          .gte('created_at', weekAgo)
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;

        const rows = (data || []) as FallbackGen[];
        const fallbacks = rows.filter(r => r.image_fallback_error || (r.image_model && !r.image_model.startsWith('fal-ai/')));
        const lastWithError = fallbacks.find(f => f.image_fallback_error);

        setStats({
          totalWithImages: rows.length,
          fallbackCount: fallbacks.length,
          lastError: lastWithError?.image_fallback_error ?? null,
          lastErrorAt: lastWithError?.created_at ?? fallbacks[0]?.created_at ?? null,
          recent: fallbacks.slice(0, 5),
        });
      } catch (err) {
        console.error('ImageFallbackAlert fetch error:', err);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return null;

  // Healthy: no fallbacks in the last 7 days
  if (stats.fallbackCount === 0) {
    if (stats.totalWithImages === 0) return null;
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex items-center gap-3" data-testid="status-image-pipeline-healthy">
        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-800">Image pipeline healthy</p>
          <p className="text-xs text-stone-500">All {stats.totalWithImages} image generation{stats.totalWithImages !== 1 ? 's' : ''} in the last 7 days used the primary (fal.ai) generator.</p>
        </div>
      </div>
    );
  }

  const rate = stats.totalWithImages > 0 ? Math.round((stats.fallbackCount / stats.totalWithImages) * 100) : 0;
  const cls = classifyError(stats.lastError);
  const HintIcon = cls.icon;

  return (
    <div className="bg-red-50 rounded-2xl shadow-sm border border-red-200 overflow-hidden" data-testid="alert-image-fallback">
      <div className="p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
          <ImageOff className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-red-800" data-testid="text-fallback-headline">
              Image quality degraded — backup generator in use
            </p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white" data-testid="text-fallback-rate">
              {stats.fallbackCount} of {stats.totalWithImages} ({rate}%) last 7 days
            </span>
          </div>
          <p className="text-xs text-red-700 mt-1">
            Generations fell back from fal.ai (primary, higher quality) to the OpenAI backup generator.
            {stats.lastErrorAt && <> Last fallback: {new Date(stats.lastErrorAt).toLocaleString()}.</>}
          </p>
          {stats.lastError && (
            <div className="mt-2 bg-white/70 rounded-lg p-2.5 border border-red-100">
              <div className="flex items-center gap-1.5 mb-1">
                <HintIcon className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-red-800" data-testid="text-fallback-cause">{cls.label}</span>
              </div>
              <p className="text-[11px] text-stone-600 mb-1.5">{cls.hint}</p>
              <code className="block text-[10px] text-red-700 bg-red-50 rounded px-2 py-1 break-all" data-testid="text-fallback-error">
                {stats.lastError}
              </code>
            </div>
          )}
          {stats.recent.length > 1 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 flex items-center gap-1 text-[11px] font-medium text-red-700 hover:text-red-900 transition-colors"
              data-testid="button-toggle-fallback-list"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Hide' : 'Show'} recent fallbacks ({stats.recent.length})
            </button>
          )}
          {expanded && (
            <div className="mt-2 space-y-1.5">
              {stats.recent.map(g => (
                <div key={g.id} className="flex items-start justify-between gap-2 bg-white/70 rounded-lg px-2.5 py-1.5 border border-red-100" data-testid={`row-fallback-${g.id}`}>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-stone-700">{g.service_type} → {g.image_model}</p>
                    {g.image_fallback_error && (
                      <p className="text-[10px] text-red-600 truncate">{g.image_fallback_error}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-400 flex-shrink-0">
                    {g.created_at ? new Date(g.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
