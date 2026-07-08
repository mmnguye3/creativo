import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ShieldAlert, ShieldCheck, ShieldX, Download, ChevronLeft, ChevronRight,
  AlertTriangle, Ban, CheckCircle2, Loader2, Eye, Zap, Clock,
  FileSearch, Dices, Plus, Trash2, RefreshCw, ImageOff, Send, Wand2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ModerationLog {
  id: string;
  user_id: string;
  user_email: string | null;
  agency_name: string | null;
  prompt: string;
  service_type: string | null;
  flagged_categories: string[];
  source: string;
  action_taken: string;
  tier: number | null;
  layer_triggered: string | null;
  alert_resolved: boolean;
  created_at: string;
}

interface PendingApproval {
  id: string;
  user_id: string;
  service_type: string;
  description: string | null;
  review_status: string | null;
  review_reason: string | null;
  admin_image_url: string | null;
  admin_image_model: string | null;
  admin_generated_at: string | null;
  released_at: string | null;
  rejection_reason: string | null;
  created_at: string | null;
}

interface FlaggedAccount {
  user_id: string;
  user_email: string | null;
  agency_name: string | null;
  first_name: string | null;
  last_name: string | null;
  violation_count: number;
  under_review: boolean;
  suspended: boolean;
  last_violation: string | null;
}

interface GamblingEntry {
  id: string;
  user_id: string;
  user_email: string | null;
  notes: string | null;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const TABS = [
  { key: 'overview',   label: 'Overview',         icon: ShieldAlert },
  { key: 'tier1',      label: 'Tier 1 Alerts',    icon: Zap },
  { key: 'pending',    label: 'Pending Approvals', icon: FileSearch },
  { key: 'accounts',   label: 'Flagged Accounts',  icon: Ban },
  { key: 'gambling',   label: 'Gambling Whitelist',icon: Dices },
] as const;

type TabKey = typeof TABS[number]['key'];

const ACTION_CHIP: Record<string, string> = {
  blocked:           'bg-red-100 text-red-600',
  error_blocked:     'bg-orange-100 text-orange-600',
  rate_limited:      'bg-purple-100 text-purple-600',
  allowed_whitelist: 'bg-emerald-100 text-emerald-700',
  cleared:           'bg-green-100 text-green-700',
  warned:            'bg-yellow-100 text-yellow-700',
};

const SOURCE_CHIP: Record<string, string> = {
  prompt:     'bg-blue-100 text-blue-700',
  image:      'bg-purple-100 text-purple-700',
  suspension: 'bg-stone-200 text-stone-600',
  'rate-limit': 'bg-violet-100 text-violet-600',
};

const TIER_CHIP: Record<number, string> = {
  1: 'bg-red-600 text-white',
  2: 'bg-amber-100 text-amber-700',
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit',
  });
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-stone-400">
      <Icon className="w-12 h-12 mb-2 opacity-20" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

function Paginator({ page, total, pageSize, onChange }: {
  page: number; total: number; pageSize: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-stone-100">
      <p className="text-xs text-stone-400">Page {page + 1} of {totalPages} · {total} records</p>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}
          className="h-7 w-7 p-0 rounded-lg border-stone-200" data-testid="button-prev-page">
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}
          className="h-7 w-7 p-0 rounded-lg border-stone-200" data-testid="button-next-page">
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminCompliance() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // ── Overview stats ──
  const [stats, setStats] = useState({ total: 0, tier1Unresolved: 0, pendingApprovals: 0, underReview: 0, suspended: 0 });

  // ── All logs (overview / CSV) ──
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logsPage, setLogsPage] = useState(0);

  // ── Tier 1 alerts ──
  const [tier1, setTier1] = useState<ModerationLog[]>([]);
  const [totalTier1, setTotalTier1] = useState(0);
  const [tier1Page, setTier1Page] = useState(0);

  // ── Pending approvals ──
  const [pending, setPending] = useState<PendingApproval[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [pendingPage, setPendingPage] = useState(0);

  // ── Flagged accounts ──
  const [accounts, setAccounts] = useState<FlaggedAccount[]>([]);

  // ── Gambling whitelist ──
  const [whitelist, setWhitelist] = useState<GamblingEntry[]>([]);
  const [newWlUserId, setNewWlUserId] = useState('');
  const [newWlNotes, setNewWlNotes] = useState('');
  const [wlBusy, setWlBusy] = useState(false);

  // ── UI state ──
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState<ModerationLog | null>(null);

  // ── Gate-2 review dialog state ──
  const [reviewDialog, setReviewDialog] = useState<PendingApproval | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async (pageNum: number) => {
    const from = pageNum * PAGE_SIZE;
    const { data, error, count } = await supabase
      .from('moderation_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    setLogs((data || []) as ModerationLog[]);
    setTotalLogs(count || 0);
  }, []);

  const fetchTier1 = useCallback(async (pageNum: number) => {
    const from = pageNum * PAGE_SIZE;
    const { data, error, count } = await supabase
      .from('moderation_logs')
      .select('*', { count: 'exact' })
      .eq('tier', 1)
      .eq('alert_resolved', false)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    setTier1((data || []) as ModerationLog[]);
    setTotalTier1(count || 0);
  }, []);

  const fetchPending = useCallback(async (pageNum: number) => {
    const from = pageNum * PAGE_SIZE;
    const { data, error, count } = await supabase
      .from('ai_generations')
      .select(
        'id, user_id, service_type, description, review_status, review_reason, admin_image_url, admin_image_model, admin_generated_at, released_at, rejection_reason, created_at',
        { count: 'exact' },
      )
      .eq('review_status', 'pending_review')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    setPending((data || []) as PendingApproval[]);
    setTotalPending(count || 0);
  }, []);

  const fetchAccounts = useCallback(async () => {
    const [{ data: allLogs, error: logsErr }, { data: flaggedProfiles, error: profErr }] = await Promise.all([
      supabase
        .from('moderation_logs')
        .select('user_id, user_email, agency_name, created_at, action_taken')
        .limit(2000),
      supabase
        .from('profiles')
        .select('id, first_name, last_name, under_review, suspended')
        .or('under_review.eq.true,suspended.eq.true'),
    ]);
    if (logsErr) throw logsErr;
    if (profErr) throw profErr;

    type AggEntry = { count: number; agency: string | null; last: string | null; email: string | null };
    const byUser = new Map<string, AggEntry>();

    (allLogs || []).forEach(l => {
      const cur = byUser.get(l.user_id) || { count: 0, agency: null, last: null, email: null };
      if (l.action_taken === 'blocked' || l.action_taken === 'error_blocked') cur.count += 1;
      cur.agency = cur.agency ?? l.agency_name;
      cur.email = cur.email ?? (l as { user_email?: string | null }).user_email ?? null;
      if (!cur.last || l.created_at > cur.last) cur.last = l.created_at;
      byUser.set(l.user_id, cur);
    });
    (flaggedProfiles || []).forEach(p => {
      if (!byUser.has(p.id)) byUser.set(p.id, { count: 0, agency: null, last: null, email: null });
    });

    const ids = Array.from(byUser.keys());
    if (ids.length === 0) { setAccounts([]); return; }

    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, under_review, suspended')
      .in('id', ids);
    if (pErr) throw pErr;

    const profMap = new Map((profiles || []).map(p => [p.id, p]));
    const result: FlaggedAccount[] = ids.map(uid => {
      const agg = byUser.get(uid)!;
      const prof = profMap.get(uid);
      return {
        user_id: uid,
        user_email: agg.email,
        agency_name: agg.agency,
        first_name: prof?.first_name ?? null,
        last_name: prof?.last_name ?? null,
        violation_count: agg.count,
        under_review: prof?.under_review ?? false,
        suspended: prof?.suspended ?? false,
        last_violation: agg.last,
      };
    }).sort((a, b) => b.violation_count - a.violation_count);

    setAccounts(result);
  }, []);

  const fetchWhitelist = useCallback(async () => {
    const { data, error } = await supabase
      .from('gambling_whitelist')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    setWhitelist((data || []) as GamblingEntry[]);
  }, []);

  const fetchStats = useCallback(async () => {
    const [
      { count: total },
      { count: tier1Count },
      { count: pendingCount },
      { data: flagProfiles },
    ] = await Promise.all([
      supabase.from('moderation_logs').select('*', { count: 'exact', head: true }),
      supabase.from('moderation_logs').select('*', { count: 'exact', head: true }).eq('tier', 1).eq('alert_resolved', false),
      supabase.from('ai_generations').select('*', { count: 'exact', head: true }).eq('review_status', 'pending_review'),
      supabase.from('profiles').select('id, under_review, suspended').or('under_review.eq.true,suspended.eq.true'),
    ]);
    const profs = flagProfiles || [];
    setStats({
      total: total || 0,
      tier1Unresolved: tier1Count || 0,
      pendingApprovals: pendingCount || 0,
      underReview: profs.filter(p => p.under_review && !p.suspended).length,
      suspended: profs.filter(p => p.suspended).length,
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      await Promise.all([
        fetchStats(),
        fetchLogs(logsPage),
        fetchTier1(tier1Page),
        fetchPending(pendingPage),
        fetchAccounts(),
        fetchWhitelist(),
      ]);
    } catch (err) {
      console.error('Compliance load error:', err);
      toast({ title: 'Failed to load compliance data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchLogs, fetchTier1, fetchPending, fetchAccounts, fetchWhitelist, logsPage, tier1Page, pendingPage, toast]);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const resolveAlert = async (logId: string) => {
    setActionBusy(logId);
    const { error } = await supabase
      .from('moderation_logs')
      .update({ alert_resolved: true })
      .eq('id', logId);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Alert resolved' });
      await refresh();
    }
    setActionBusy(null);
  };

  const setLogAction = async (log: ModerationLog, action: 'cleared' | 'warned') => {
    setActionBusy(log.id);
    const { error } = await supabase.from('moderation_logs').update({ action_taken: action }).eq('id', log.id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: action === 'cleared' ? 'Violation cleared' : 'User warned' });
      await refresh();
    }
    setActionBusy(null);
  };

  // ── Gate-2 review dialog helpers ─────────────────────────────────────────────

  const openReviewDialog = (gen: PendingApproval) => {
    setReviewDialog(gen);
    setRejectMode(false);
    setRejectReason('');
    setSafetyWarning(null);
  };

  const closeReviewDialog = () => {
    setReviewDialog(null);
    setRejectMode(false);
    setRejectReason('');
    setSafetyWarning(null);
  };

  const handleAdminGenerate = async (gen: PendingApproval, isRegenerate = false) => {
    setActionBusy(gen.id);
    setSafetyWarning(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-review-action', {
        body: { action: isRegenerate ? 'regenerate' : 'approve_and_generate', generationId: gen.id },
      });
      if (error) throw new Error(error.message || 'Edge function error');
      if (data?.safetyFlagged) {
        setSafetyWarning(data.message ?? 'The generated image was flagged by the safety screen. Please reject this request.');
        toast({ title: 'Safety screen flagged the output', description: data.message, variant: 'destructive' });
      } else {
        setReviewDialog(prev => prev ? { ...prev, admin_image_url: data.adminImageUrl ?? prev.admin_image_url, admin_image_model: data.adminImageModel ?? prev.admin_image_model } : null);
        toast({ title: isRegenerate ? 'Image regenerated' : 'Image generated', description: 'Review the image below before releasing to the agency.' });
        await fetchPending(pendingPage);
      }
    } catch (err) {
      toast({ title: 'Generation failed', description: (err as Error).message, variant: 'destructive' });
    }
    setActionBusy(null);
  };

  const handleAdminRelease = async (gen: PendingApproval) => {
    setActionBusy(gen.id);
    try {
      const { error } = await supabase.functions.invoke('admin-review-action', {
        body: { action: 'release', generationId: gen.id },
      });
      if (error) throw new Error(error.message || 'Edge function error');
      toast({ title: 'Released to agency', description: 'The generation is now available to the vendor.' });
      closeReviewDialog();
      await Promise.all([fetchPending(pendingPage), fetchStats()]);
    } catch (err) {
      toast({ title: 'Release failed', description: (err as Error).message, variant: 'destructive' });
    }
    setActionBusy(null);
  };

  const handleAdminReject = async (gen: PendingApproval) => {
    if (!rejectReason.trim()) {
      toast({ title: 'Rejection reason required', description: 'Please enter a reason so the vendor understands why their request was declined.', variant: 'destructive' });
      return;
    }
    setActionBusy(gen.id);
    try {
      const { error } = await supabase.functions.invoke('admin-review-action', {
        body: { action: 'reject', generationId: gen.id, rejectionReason: rejectReason },
      });
      if (error) throw new Error(error.message || 'Edge function error');
      toast({ title: 'Request rejected', description: 'The vendor has been notified.' });
      closeReviewDialog();
      await Promise.all([fetchPending(pendingPage), fetchStats()]);
    } catch (err) {
      toast({ title: 'Reject failed', description: (err as Error).message, variant: 'destructive' });
    }
    setActionBusy(null);
  };

  const exportReviewCsv = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_generations')
        .select('id, user_id, service_type, description, review_status, review_reason, reviewed_at, reviewed_by, released_at, rejected_reason:rejection_reason, admin_image_model, created_at')
        .in('review_status', ['approved', 'rejected'])
        .order('reviewed_at', { ascending: false })
        .limit(2000);
      if (error) throw error;
      const rows = data || [];
      const header = ['id', 'user_id', 'service_type', 'description', 'review_status', 'review_reason', 'reviewed_at', 'reviewed_by', 'released_at', 'rejection_reason', 'admin_image_model', 'created_at'];
      const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = [
        header.join(','),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...rows.map((r: any) => header.map(k => esc(r[k])).join(',')),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `review-decisions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Review log exported', description: `${rows.length} decisions exported.` });
    } catch (err) {
      toast({ title: 'Export failed', description: (err as Error).message, variant: 'destructive' });
    }
  };

  // Fire-and-forget email notification; never blocks the admin action.
  const notifyStatusChange = (userId: string, status: 'suspended' | 'reinstated' | 'review_cleared') => {
    supabase.functions.invoke('notify-account-status', { body: { userId, status } })
      .then(({ error }) => {
        if (error) console.error('Status email failed:', error.message);
      })
      .catch((err: Error) => console.error('Status email failed:', err.message));
  };

  const setSuspended = async (userId: string, suspended: boolean) => {
    setActionBusy(userId);
    const { error } = await supabase.from('profiles').update({ suspended }).eq('id', userId);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      notifyStatusChange(userId, suspended ? 'suspended' : 'reinstated');
      toast({
        title: suspended ? 'Account suspended' : 'Account reinstated',
        description: 'The user is being notified by email.',
      });
      await refresh();
    }
    setActionBusy(null);
  };

  const clearReview = async (userId: string) => {
    setActionBusy(userId);
    const { error } = await supabase.from('profiles').update({ under_review: false }).eq('id', userId);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      notifyStatusChange(userId, 'review_cleared');
      toast({ title: 'Review flag cleared', description: 'The user is being notified by email.' });
      await refresh();
    }
    setActionBusy(null);
  };

  const addToWhitelist = async () => {
    if (!newWlUserId.trim()) return;
    setWlBusy(true);
    const { error } = await supabase
      .from('gambling_whitelist')
      .insert({ user_id: newWlUserId.trim(), notes: newWlNotes.trim() || null });
    if (error) {
      toast({ title: 'Failed to add', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'User added to gambling whitelist' });
      setNewWlUserId('');
      setNewWlNotes('');
      await fetchWhitelist();
    }
    setWlBusy(false);
  };

  const removeFromWhitelist = async (id: string) => {
    setActionBusy(id);
    const { error } = await supabase.from('gambling_whitelist').delete().eq('id', id);
    if (error) {
      toast({ title: 'Failed to remove', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'User removed from whitelist' });
      await fetchWhitelist();
    }
    setActionBusy(null);
  };

  const exportCsv = async () => {
    try {
      const { data, error } = await supabase
        .from('moderation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5000);
      if (error) throw error;
      const rows = (data || []) as ModerationLog[];
      const header = [
        'id', 'user_id', 'user_email', 'agency_name', 'service_type',
        'source', 'tier', 'layer_triggered', 'action_taken', 'alert_resolved',
        'flagged_categories', 'prompt', 'created_at',
      ];
      const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = [
        header.join(','),
        ...rows.map(r => [
          r.id, r.user_id, r.user_email, r.agency_name, r.service_type,
          r.source, r.tier, r.layer_triggered, r.action_taken, r.alert_resolved,
          (r.flagged_categories || []).join('; '), r.prompt, r.created_at,
        ].map(esc).join(',')),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moderation-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'CSV exported', description: `${rows.length} records exported.` });
    } catch (err) {
      toast({ title: 'Export failed', description: (err as Error).message, variant: 'destructive' });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading compliance data…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Tab bar ── */}
      <div className="flex flex-wrap gap-1 bg-stone-100 p-1 rounded-2xl">
        {TABS.map(({ key, label, icon: Icon }) => {
          const badge =
            key === 'tier1'   ? stats.tier1Unresolved :
            key === 'pending' ? stats.pendingApprovals : 0;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              data-testid={`tab-${key}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === key
                  ? 'bg-white shadow-sm text-stone-800'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {badge > 0 && (
                <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={refresh}
          className="ml-auto p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-white/60 transition-colors"
          title="Refresh"
          data-testid="button-refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Overview                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: 'Total flagged', value: stats.total,           icon: ShieldAlert,  color: 'text-red-500',    bg: 'bg-red-50',    testid: 'text-total-violations' },
              { label: 'Tier 1 open',   value: stats.tier1Unresolved, icon: Zap,          color: 'text-red-600',    bg: 'bg-red-100',   testid: 'text-tier1-count' },
              { label: 'Pending review',value: stats.pendingApprovals,icon: FileSearch,   color: 'text-amber-500',  bg: 'bg-amber-50',  testid: 'text-pending-count' },
              { label: 'Under review',  value: stats.underReview,     icon: AlertTriangle,color: 'text-yellow-500', bg: 'bg-yellow-50', testid: 'text-under-review-count' },
              { label: 'Suspended',     value: stats.suspended,        icon: Ban,          color: 'text-stone-500',  bg: 'bg-stone-100', testid: 'text-suspended-count' },
            ].map(({ label, value, icon: Icon, color, bg, testid }) => (
              <div key={label} className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-stone-800" data-testid={testid}>{value}</p>
                  <p className="text-[10px] text-stone-400 leading-tight">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* All logs table */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-stone-100">
              <div>
                <h3 className="font-semibold text-stone-800">All Moderation Logs</h3>
                <p className="text-xs text-stone-400 mt-0.5">Every flagged attempt, most recent first</p>
              </div>
              <Button variant="outline" size="sm" onClick={exportCsv}
                className="h-8 text-xs rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50"
                data-testid="button-export-csv">
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
              </Button>
            </div>
            <LogsTable logs={logs} actionBusy={actionBusy} onView={setDetail} onAction={setLogAction} />
            <Paginator page={logsPage} total={totalLogs} pageSize={PAGE_SIZE} onChange={p => { setLogsPage(p); fetchLogs(p); }} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Tier 1 Alerts                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tier1' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
              <Zap className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800">Tier 1 Alerts — Unresolved</h3>
              <p className="text-xs text-stone-400 mt-0.5">
                CSAM · NCII · Terrorism · Political deepfakes — auto-suspended accounts
              </p>
            </div>
            {stats.tier1Unresolved > 0 && (
              <span className="ml-auto min-w-[24px] h-6 px-2 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {stats.tier1Unresolved}
              </span>
            )}
          </div>
          {tier1.length === 0 ? (
            <EmptyState icon={ShieldCheck} label="No unresolved Tier 1 alerts" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100">
                    {['User / Email', 'Prompt', 'Categories', 'Layer', 'Date', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-stone-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {tier1.map(log => (
                    <tr key={log.id} className="hover:bg-stone-50/60 transition-colors bg-red-50/30"
                      data-testid={`row-tier1-${log.id}`}>
                      <td className="px-4 py-3 text-xs">
                        <p className="font-medium text-stone-700 font-mono">{log.user_id.slice(0, 8)}…</p>
                        {log.user_email && <p className="text-stone-400">{log.user_email}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500 max-w-[200px]">
                        <button onClick={() => setDetail(log)} className="truncate block max-w-full text-left hover:text-stone-800"
                          data-testid={`button-view-prompt-${log.id}`}>
                          {log.prompt}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {log.flagged_categories.slice(0, 2).map(cat => (
                            <span key={cat} className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">{cat}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">
                          {log.layer_triggered || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap">{fmtDate(log.created_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => resolveAlert(log.id)}
                          disabled={actionBusy === log.id}
                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                          data-testid={`button-resolve-${log.id}`}
                        >
                          {actionBusy === log.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Paginator page={tier1Page} total={totalTier1} pageSize={PAGE_SIZE} onChange={p => { setTier1Page(p); fetchTier1(p); }} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Pending Approvals (Gate-2 two-step review queue)                 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-stone-100">
            <div>
              <h3 className="font-semibold text-stone-800">Gray-Zone Review Queue</h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Requests flagged as brand / IP gray-zone — HELD, not generated. Admin must approve &amp; generate, then release or reject.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={exportReviewCsv}
              className="h-8 text-xs rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50"
              data-testid="button-export-review-csv">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export Review Log
            </Button>
          </div>
          {pending.length === 0 ? (
            <EmptyState icon={FileSearch} label="No pending approvals" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100">
                    {['User', 'Service', 'Prompt', 'Flag Reason', 'Image', 'Submitted', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-stone-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {pending.map(gen => (
                    <tr key={gen.id} className="hover:bg-amber-50/30 transition-colors" data-testid={`row-pending-${gen.id}`}>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500">{gen.user_id.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-xs text-stone-700 whitespace-nowrap">
                        {gen.service_type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500 max-w-[180px]">
                        <span className="line-clamp-2">{gen.description || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          {gen.review_reason || 'brand-ip-gray-zone'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {gen.admin_image_url ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-stone-200 bg-stone-50">
                            <img src={gen.admin_image_url} alt="Admin preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-dashed border-stone-300 bg-stone-50 flex items-center justify-center">
                            <ImageOff className="w-3.5 h-3.5 text-stone-300" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap">{fmtDate(gen.created_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openReviewDialog(gen)}
                          className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors font-medium"
                          data-testid={`button-review-${gen.id}`}
                        >
                          <Eye className="w-3 h-3" /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Paginator page={pendingPage} total={totalPending} pageSize={PAGE_SIZE} onChange={p => { setPendingPage(p); fetchPending(p); }} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Flagged Accounts                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'accounts' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <h3 className="font-semibold text-stone-800">Flagged Accounts</h3>
            <p className="text-xs text-stone-400 mt-0.5">Accounts with violations, under review, or suspended</p>
          </div>
          {accounts.length === 0 ? (
            <EmptyState icon={ShieldCheck} label="No flagged accounts" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100">
                    {['Account', 'Email', 'Violations', 'Status', 'Last Violation', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-stone-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {accounts.map(acc => {
                    const name = `${acc.first_name || ''} ${acc.last_name || ''}`.trim();
                    return (
                      <tr key={acc.user_id} className="hover:bg-stone-50/60 transition-colors"
                        data-testid={`row-account-${acc.user_id}`}>
                        <td className="px-4 py-3 text-xs font-medium text-stone-700">
                          {name || <span className="font-mono text-stone-400">{acc.user_id.slice(0, 8)}…</span>}
                          {acc.agency_name && <p className="text-stone-400 font-normal">{acc.agency_name}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-500">{acc.user_email || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${acc.violation_count >= 3 ? 'text-red-600' : 'text-stone-700'}`}>
                            {acc.violation_count}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {acc.suspended && (
                              <Badge className="bg-red-100 text-red-600 border-0 text-[10px] hover:bg-red-100">Suspended</Badge>
                            )}
                            {acc.under_review && !acc.suspended && (
                              <Badge className="bg-yellow-100 text-yellow-700 border-0 text-[10px] hover:bg-yellow-100">Under Review</Badge>
                            )}
                            {!acc.suspended && !acc.under_review && (
                              <Badge className="bg-stone-100 text-stone-500 border-0 text-[10px] hover:bg-stone-100">Active</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap">{fmtDate(acc.last_violation)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {acc.under_review && (
                              <Button variant="outline" size="sm" disabled={actionBusy === acc.user_id}
                                onClick={() => clearReview(acc.user_id)}
                                className="h-6 text-[10px] px-2 rounded-lg border-stone-200 text-stone-600 hover:bg-stone-50"
                                data-testid={`button-clear-review-${acc.user_id}`}>
                                Clear Review
                              </Button>
                            )}
                            {acc.suspended ? (
                              <Button variant="outline" size="sm" disabled={actionBusy === acc.user_id}
                                onClick={() => setSuspended(acc.user_id, false)}
                                className="h-6 text-[10px] px-2 rounded-lg border-green-200 text-green-600 hover:bg-green-50"
                                data-testid={`button-reinstate-${acc.user_id}`}>
                                <ShieldCheck className="w-3 h-3 mr-1" /> Reinstate
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" disabled={actionBusy === acc.user_id}
                                onClick={() => setSuspended(acc.user_id, true)}
                                className="h-6 text-[10px] px-2 rounded-lg border-red-200 text-red-500 hover:bg-red-50"
                                data-testid={`button-suspend-${acc.user_id}`}>
                                <ShieldX className="w-3 h-3 mr-1" /> Suspend
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Gambling Whitelist                                                */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'gambling' && (
        <div className="space-y-4">
          {/* Add entry form */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
            <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <Dices className="w-4 h-4 text-stone-500" />
              Add to Gambling Whitelist
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Users on this list may generate gambling-adjacent content. Verify licensure before adding.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="User UUID"
                value={newWlUserId}
                onChange={e => setNewWlUserId(e.target.value)}
                className="flex-1 h-9 text-sm rounded-xl border-stone-200"
                data-testid="input-whitelist-userid"
              />
              <Input
                placeholder="Notes (optional — e.g. licensed operator)"
                value={newWlNotes}
                onChange={e => setNewWlNotes(e.target.value)}
                className="flex-1 h-9 text-sm rounded-xl border-stone-200"
                data-testid="input-whitelist-note"
              />
              <Button
                onClick={addToWhitelist}
                disabled={wlBusy || !newWlUserId.trim()}
                className="h-9 px-4 rounded-xl bg-stone-800 text-white hover:bg-stone-700 text-sm"
                data-testid="button-whitelist-add"
              >
                {wlBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                Add
              </Button>
            </div>
          </div>

          {/* Whitelist table */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <h3 className="font-semibold text-stone-800">Current Whitelist</h3>
              <p className="text-xs text-stone-400 mt-0.5">{whitelist.length} {whitelist.length === 1 ? 'entry' : 'entries'}</p>
            </div>
            {whitelist.length === 0 ? (
              <EmptyState icon={Dices} label="No users on the gambling whitelist" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100">
                      {['User ID', 'Note', 'Added', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-stone-400 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {whitelist.map(entry => (
                      <tr key={entry.id} className="hover:bg-stone-50/60 transition-colors"
                        data-testid={`row-whitelist-${entry.id}`}>
                        <td className="px-4 py-3 text-xs font-mono text-stone-600">{entry.user_id}</td>
                        <td className="px-4 py-3 text-xs text-stone-500">{entry.notes || '—'}</td>
                        <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap">{fmtDate(entry.created_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => removeFromWhitelist(entry.id)}
                            disabled={actionBusy === entry.id}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                            data-testid={`button-whitelist-remove-${entry.id}`}
                          >
                            {actionBusy === entry.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Gate-2 Review Dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!reviewDialog} onOpenChange={open => { if (!open) closeReviewDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-amber-500" />
              Gray-Zone Review — Gate 2
            </DialogTitle>
          </DialogHeader>
          {reviewDialog && (() => {
            const gen = reviewDialog;
            const busy = actionBusy === gen.id;
            const hasAdminImage = !!gen.admin_image_url;
            return (
              <div className="space-y-4 text-sm">
                {/* Meta */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] font-medium text-stone-400 mb-0.5">User</p>
                    <p className="text-xs text-stone-700 font-mono">{gen.user_id.slice(0, 8)}…</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-stone-400 mb-0.5">Service</p>
                    <p className="text-xs text-stone-700">{gen.service_type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-stone-400 mb-0.5">Submitted</p>
                    <p className="text-xs text-stone-700">{fmtDate(gen.created_at)}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <p className="text-[10px] font-medium text-stone-400 mb-0.5">Flag Reason</p>
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      {gen.review_reason || 'brand-ip-gray-zone'}
                    </span>
                  </div>
                </div>

                {/* Prompt */}
                <div>
                  <p className="text-[10px] font-medium text-stone-400 mb-1">Vendor Prompt</p>
                  <p className="text-xs text-stone-700 bg-stone-50 rounded-lg p-3 whitespace-pre-wrap max-h-28 overflow-y-auto border border-stone-100">
                    {gen.description || '(no description)'}
                  </p>
                </div>

                {/* Safety warning */}
                {safetyWarning && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{safetyWarning}</p>
                  </div>
                )}

                {/* Image slot */}
                <div>
                  <p className="text-[10px] font-medium text-stone-400 mb-2">
                    Generated Image (Admin-only preview — not visible to vendor until released)
                  </p>
                  {hasAdminImage ? (
                    <div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
                      <img
                        src={gen.admin_image_url!}
                        alt="Admin-generated preview"
                        className="w-full max-h-64 object-contain"
                      />
                      {gen.admin_image_model && (
                        <p className="text-[10px] text-stone-400 px-3 py-1.5 border-t border-stone-100">
                          Model: {gen.admin_image_model}
                          {gen.admin_generated_at && ` · Generated ${fmtDate(gen.admin_generated_at)}`}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-xl py-10 bg-stone-50 text-stone-400 gap-2">
                      <ImageOff className="w-8 h-8 opacity-40" />
                      <p className="text-xs font-medium">Not generated — awaiting review</p>
                      <p className="text-[10px]">Click "Approve &amp; Generate" to create the image for admin review</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!rejectMode ? (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
                    {!hasAdminImage ? (
                      <Button
                        onClick={() => handleAdminGenerate(gen)}
                        disabled={busy}
                        className="h-8 px-3 text-xs rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                        data-testid={`button-admin-generate-${gen.id}`}
                      >
                        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Wand2 className="w-3.5 h-3.5 mr-1.5" />}
                        Approve &amp; Generate
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleAdminRelease(gen)}
                          disabled={busy}
                          className="h-8 px-3 text-xs rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                          data-testid={`button-admin-release-${gen.id}`}
                        >
                          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                          Release to Agency
                        </Button>
                        <Button
                          onClick={() => handleAdminGenerate(gen, true)}
                          disabled={busy}
                          variant="outline"
                          className="h-8 px-3 text-xs rounded-xl border-stone-200"
                          data-testid={`button-admin-regenerate-${gen.id}`}
                        >
                          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                          Regenerate
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => setRejectMode(true)}
                      disabled={busy}
                      variant="outline"
                      className="h-8 px-3 text-xs rounded-xl border-red-200 text-red-500 hover:bg-red-50 ml-auto"
                      data-testid={`button-admin-reject-open-${gen.id}`}
                    >
                      <ShieldX className="w-3.5 h-3.5 mr-1.5" /> Reject
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <p className="text-xs font-medium text-stone-600">Rejection reason (visible to vendor):</p>
                    <Textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="e.g. This request references a registered trademark and cannot be approved..."
                      className="text-xs resize-none h-20 rounded-xl border-stone-200"
                      data-testid="input-reject-reason"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAdminReject(gen)}
                        disabled={busy || !rejectReason.trim()}
                        className="h-8 px-3 text-xs rounded-xl bg-red-600 text-white hover:bg-red-700"
                        data-testid={`button-admin-reject-confirm-${gen.id}`}
                      >
                        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <ShieldX className="w-3.5 h-3.5 mr-1.5" />}
                        Confirm Reject
                      </Button>
                      <Button
                        onClick={() => { setRejectMode(false); setRejectReason(''); }}
                        variant="outline"
                        className="h-8 px-3 text-xs rounded-xl border-stone-200"
                        data-testid="button-reject-cancel"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Detail dialog ── */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              Violation Detail
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium text-stone-400 mb-1">Prompt</p>
                <p className="text-xs text-stone-700 bg-stone-50 rounded-lg p-3 whitespace-pre-wrap max-h-48 overflow-y-auto">{detail.prompt}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-stone-400 mb-1">User</p>
                  <p className="text-xs text-stone-700 font-mono">{detail.user_id.slice(0, 8)}…</p>
                  {detail.user_email && <p className="text-xs text-stone-500">{detail.user_email}</p>}
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 mb-1">Service Type</p>
                  <p className="text-xs text-stone-700">{detail.service_type || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 mb-1">Source</p>
                  <p className="text-xs text-stone-700 capitalize">{detail.source}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 mb-1">Action</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ACTION_CHIP[detail.action_taken] || 'bg-stone-100 text-stone-600'}`}>
                    {detail.action_taken}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 mb-1">Tier</p>
                  {detail.tier ? (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${TIER_CHIP[detail.tier] || 'bg-stone-100 text-stone-600'}`}>
                      Tier {detail.tier}
                    </span>
                  ) : <p className="text-xs text-stone-400">—</p>}
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 mb-1">Layer</p>
                  <p className="text-xs text-stone-700">{detail.layer_triggered || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 mb-1">Alert Resolved</p>
                  <div className="flex items-center gap-1">
                    {detail.alert_resolved
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      : <Clock className="w-3.5 h-3.5 text-amber-500" />}
                    <p className="text-xs text-stone-700">{detail.alert_resolved ? 'Yes' : 'Pending'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 mb-1">Date</p>
                  <p className="text-xs text-stone-700">{fmtDate(detail.created_at)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-stone-400 mb-1">Flagged Categories</p>
                <div className="flex flex-wrap gap-1">
                  {detail.flagged_categories.map(cat => (
                    <span key={cat} className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">{cat}</span>
                  ))}
                </div>
              </div>
              {detail.action_taken === 'blocked' && !detail.alert_resolved && (
                <div className="flex gap-2 pt-1 border-t border-stone-100">
                  <button
                    onClick={() => { setLogAction(detail, 'cleared'); setDetail(null); }}
                    disabled={actionBusy === detail.id}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Clear (false positive)
                  </button>
                  <button
                    onClick={() => { setLogAction(detail, 'warned'); setDetail(null); }}
                    disabled={actionBusy === detail.id}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-yellow-200 text-yellow-600 hover:bg-yellow-50 transition-colors disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Mark Warned
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Extracted LogsTable sub-component (used in Overview tab) ───────────────────

function LogsTable({ logs, actionBusy, onView, onAction }: {
  logs: ModerationLog[];
  actionBusy: string | null;
  onView: (log: ModerationLog) => void;
  onAction: (log: ModerationLog, action: 'cleared' | 'warned') => void;
}) {
  const ACTION_CHIP: Record<string, string> = {
    blocked:           'bg-red-100 text-red-600',
    error_blocked:     'bg-orange-100 text-orange-600',
    rate_limited:      'bg-purple-100 text-purple-600',
    allowed_whitelist: 'bg-emerald-100 text-emerald-700',
    cleared:           'bg-green-100 text-green-700',
    warned:            'bg-yellow-100 text-yellow-700',
  };
  const TIER_CHIP: Record<number, string> = {
    1: 'bg-red-600 text-white',
    2: 'bg-amber-100 text-amber-700',
  };

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-stone-400">
        <ShieldCheck className="w-12 h-12 mb-2 opacity-20" />
        <p className="text-sm">No violations logged</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-100">
            {['User / Email', 'Prompt', 'Categories', 'Tier', 'Layer', 'Status', 'Date', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-stone-400 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {logs.map(log => (
            <tr key={log.id} className="hover:bg-stone-50/60 transition-colors" data-testid={`row-violation-${log.id}`}>
              <td className="px-4 py-3 text-xs">
                <p className="font-medium text-stone-700 font-mono">{log.user_id.slice(0, 8)}…</p>
                {log.user_email && <p className="text-stone-400">{log.user_email}</p>}
              </td>
              <td className="px-4 py-3 text-xs text-stone-500 max-w-[200px]">
                <button
                  onClick={() => onView(log)}
                  className="truncate block max-w-full text-left hover:text-stone-800"
                  title="View full prompt"
                  data-testid={`button-view-prompt-${log.id}`}
                >
                  {log.prompt}
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1 max-w-[140px]">
                  {log.flagged_categories.slice(0, 2).map(cat => (
                    <span key={cat} className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">{cat}</span>
                  ))}
                  {log.flagged_categories.length > 2 && (
                    <span className="text-[10px] text-stone-400">+{log.flagged_categories.length - 2}</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                {log.tier ? (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${TIER_CHIP[log.tier] || 'bg-stone-100 text-stone-600'}`}>
                    T{log.tier}
                  </span>
                ) : <span className="text-stone-300">—</span>}
              </td>
              <td className="px-4 py-3">
                <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                  {log.layer_triggered || '—'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ACTION_CHIP[log.action_taken] || 'bg-stone-100 text-stone-600'}`}>
                  {log.action_taken}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap">{fmtDate(log.created_at)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onView(log)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                    title="View details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {log.action_taken === 'blocked' && (
                    <>
                      <button
                        onClick={() => onAction(log, 'cleared')}
                        disabled={actionBusy === log.id}
                        className="p-1.5 rounded-lg text-green-500 hover:text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                        title="Clear (false positive)"
                        data-testid={`button-clear-${log.id}`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onAction(log, 'warned')}
                        disabled={actionBusy === log.id}
                        className="p-1.5 rounded-lg text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50 transition-colors disabled:opacity-50"
                        title="Mark as warned"
                        data-testid={`button-warn-${log.id}`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
