import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldAlert, ShieldCheck, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const PROHIBITED_CATEGORIES: Array<{ title: string; description: string }> = [
  { title: 'Counterfeit & knockoff goods', description: 'Replicas, fakes, or unauthorized use of brand names, logos, or trademarks.' },
  { title: 'Unlicensed gambling', description: 'Casinos, sports betting, slots, or any gambling promotion without a valid license.' },
  { title: 'Investment & securities scams', description: 'Pump-and-dump schemes, guaranteed returns, pyramid schemes, or misleading financial claims.' },
  { title: 'Sanctioned entities & regions', description: 'Content promoting or referencing sanctioned organizations, governments, or embargoed regions.' },
  { title: 'Election & deepfake disinformation', description: 'Election fraud claims, deepfakes, impersonation of public figures, or fabricated news.' },
  { title: 'Drugs, weapons & trafficking', description: 'Illegal drugs, firearms sales, explosives, or any form of human or organ trafficking.' },
  { title: 'Hate, violence & adult content', description: 'Hateful, violent, sexually explicit, or harassing content of any kind.' },
];

// ── Parse a CONTENT_VIOLATION / ACCOUNT_SUSPENDED payload out of a functions error ──
export interface ModerationError {
  error: 'CONTENT_VIOLATION' | 'ACCOUNT_SUSPENDED';
  category: string;
  message: string;
}

export async function parseModerationError(err: unknown): Promise<ModerationError | null> {
  try {
    const anyErr = err as { context?: Response };
    if (anyErr?.context && typeof anyErr.context.json === 'function') {
      const body = await anyErr.context.clone().json();
      if (body?.error === 'CONTENT_VIOLATION' || body?.error === 'ACCOUNT_SUSPENDED') {
        return body as ModerationError;
      }
    }
  } catch {
    // fall through
  }
  return null;
}

// ── Inline error card shown when a generation is blocked ────────────────────────
export function ViolationErrorCard({ violation, onDismiss }: {
  violation: ModerationError;
  onDismiss: () => void;
}) {
  const suspended = violation.error === 'ACCOUNT_SUSPENDED';
  return (
    <div
      className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-5 space-y-3"
      data-testid="card-content-violation"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
          <ShieldAlert className="w-5 h-5 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white">
            {suspended ? 'Account suspended' : 'Content Standards violation'}
          </h4>
          {!suspended && (
            <p className="text-xs text-red-300/90 mt-0.5 capitalize" data-testid="text-violation-category">
              Category: {violation.category}
            </p>
          )}
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{violation.message}</p>
          <p className="text-xs text-zinc-500 mt-2">
            See{' '}
            <a
              href="/terms#section-6"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 underline underline-offset-2"
              data-testid="link-tos-section-6"
            >
              Terms of Service § 6 — Acceptable Use
            </a>{' '}
            for details. Repeated violations may lead to account review or suspension.
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-zinc-400 hover:text-white hover:bg-white/5 h-7 text-xs"
          data-testid="button-dismiss-violation"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}

// ── Collapsible guidelines info panel ────────────────────────────────────────────
export function ContentGuidelinesPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
        data-testid="button-toggle-guidelines"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-zinc-300">
          <ShieldCheck className="w-4 h-4 text-orange-500" />
          Content Guidelines
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-2.5">
          <p className="text-xs text-zinc-500 leading-relaxed">
            All generation requests are automatically screened. The following content is prohibited and will be blocked:
          </p>
          <ul className="space-y-2">
            {PROHIBITED_CATEGORIES.map(cat => (
              <li key={cat.title} className="flex gap-2 text-xs">
                <span className="text-red-400/70 mt-px flex-shrink-0">✕</span>
                <span>
                  <span className="text-zinc-300 font-medium">{cat.title}</span>
                  <span className="text-zinc-500"> — {cat.description}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-zinc-600 pt-1">
            Full policy:{' '}
            <a href="/terms#section-6" target="_blank" rel="noopener noreferrer" className="text-orange-400/80 hover:text-orange-300 underline underline-offset-2">
              Terms of Service § 6
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

// ── One-time acknowledgment gate ─────────────────────────────────────────────────
// Wraps generator UIs: shows a full-card acknowledgment until content_ack_at is set.
export function useContentAck(userId: string | undefined) {
  const [ackAt, setAckAt] = useState<string | null | undefined>(undefined); // undefined = loading
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      setAckAt(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('profiles')
      .select('content_ack_at')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Failed to load content acknowledgment:', error);
          setAckAt(null);
          return;
        }
        setAckAt(data?.content_ack_at ?? null);
      });
    return () => { cancelled = true; };
  }, [userId]);

  const acknowledge = useCallback(async () => {
    if (!userId) return false;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('profiles')
      .update({ content_ack_at: now })
      .eq('id', userId);
    if (error) {
      toast({ title: 'Failed to save acknowledgment', description: error.message, variant: 'destructive' });
      return false;
    }
    setAckAt(now);
    return true;
  }, [userId, toast]);

  return { loading: ackAt === undefined, acknowledged: !!ackAt, acknowledge };
}

export function ContentAckGate({ userId, children }: {
  userId: string | undefined;
  children: React.ReactNode;
}) {
  const { loading, acknowledged, acknowledge } = useContentAck(userId);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6 text-center" data-testid="card-auth-required">
        <ShieldAlert className="w-8 h-8 text-orange-500 mx-auto mb-3" />
        <p className="text-sm text-zinc-300 font-medium">Sign in required</p>
        <p className="text-xs text-zinc-500 mt-1">Please sign in to use the content generator.</p>
      </div>
    );
  }

  if (acknowledged) return <>{children}</>;

  const handleContinue = async () => {
    setSaving(true);
    await acknowledge();
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6 max-w-2xl mx-auto space-y-5" data-testid="card-content-ack">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Content Guidelines</h3>
          <p className="text-xs text-zinc-400">One-time acknowledgment required before generating content</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <p className="text-xs text-zinc-400 leading-relaxed">
          Every generation request is automatically screened for compliance. The following content is prohibited:
        </p>
        <ul className="space-y-2">
          {PROHIBITED_CATEGORIES.map(cat => (
            <li key={cat.title} className="flex gap-2 text-xs">
              <span className="text-red-400/70 mt-px flex-shrink-0">✕</span>
              <span>
                <span className="text-zinc-300 font-medium">{cat.title}</span>
                <span className="text-zinc-500"> — {cat.description}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-zinc-500 pt-1">
          Blocked attempts are logged. Accounts with repeated violations are placed under review and may be suspended. Full policy:{' '}
          <a href="/terms#section-6" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline underline-offset-2">
            Terms of Service § 6
          </a>
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/[0.02] p-3">
        <Checkbox
          id="content-ack"
          checked={checked}
          onCheckedChange={v => setChecked(v === true)}
          className="mt-0.5 border-white/30 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
          data-testid="checkbox-content-ack"
        />
        <label htmlFor="content-ack" className="text-xs text-zinc-300 leading-relaxed cursor-pointer">
          I have read and agree to follow the Content Guidelines. I understand that prohibited content will be blocked and repeated violations may result in account suspension.
        </label>
      </div>

      <Button
        onClick={handleContinue}
        disabled={!checked || saving}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        data-testid="button-accept-guidelines"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Continue to Generator
      </Button>
    </div>
  );
}
