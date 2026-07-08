import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert, ShieldCheck, ShieldX, Download, ChevronLeft, ChevronRight,
  AlertTriangle, Ban, CheckCircle2, Loader2, Eye,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ModerationLog {
  id: string;
  user_id: string;
  agency_name: string | null;
  prompt: string;
  service_type: string | null;
  flagged_categories: string[];
  source: string;
  action_taken: string;
  created_at: string;
}

interface FlaggedAccount {
  user_id: string;
  agency_name: string | null;
  first_name: string | null;
  last_name: string | null;
  violation_count: number;
  under_review: boolean;
  suspended: boolean;
  last_violation: string | null;
}

const PAGE_SIZE = 10;

const ACTION_CHIP: Record<string, string> = {
  blocked: 'bg-red-100 text-red-600',
  cleared: 'bg-green-100 text-green-700',
  warned: 'bg-yellow-100 text-yellow-700',
};

const SOURCE_CHIP: Record<string, string> = {
  prompt: 'bg-blue-100 text-blue-700',
  image: 'bg-purple-100 text-purple-700',
  suspension: 'bg-stone-200 text-stone-600',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit',
  });
}

export default function AdminCompliance() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(0);
  const [accounts, setAccounts] = useState<FlaggedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState<ModerationLog | null>(null);

  const fetchLogs = useCallback(async (pageNum: number) => {
    const from = pageNum * PAGE_SIZE;
    const { data, error, count } = await supabase
      .from('moderation_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    setLogs(data || []);
    setTotalLogs(count || 0);
  }, []);

  const fetchAccounts = useCallback(async () => {
    // Aggregate all logs client-side (small scale) + flagged profiles
    const [{ data: allLogs, error: logsErr }, { data: flaggedProfiles, error: profErr }] = await Promise.all([
      supabase.from('moderation_logs').select('user_id, agency_name, created_at, action_taken').limit(2000),
      supabase.from('profiles').select('id, first_name, last_name, under_review, suspended')
        .or('under_review.eq.true,suspended.eq.true'),
    ]);
    if (logsErr) throw logsErr;
    if (profErr) throw profErr;

    const byUser = new Map<string, { count: number; agency: string | null; last: string | null }>();
    (allLogs || []).forEach(l => {
      const cur = byUser.get(l.user_id) || { count: 0, agency: null, last: null };
      if (l.action_taken === 'blocked') cur.count += 1;
      cur.agency = cur.agency ?? l.agency_name;
      if (!cur.last || l.created_at > cur.last) cur.last = l.created_at;
      byUser.set(l.user_id, cur);
    });
    (flaggedProfiles || []).forEach(p => {
      if (!byUser.has(p.id)) byUser.set(p.id, { count: 0, agency: null, last: null });
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

  const refresh = useCallback(async (pageNum: number) => {
    try {
      await Promise.all([fetchLogs(pageNum), fetchAccounts()]);
    } catch (err) {
      console.error('Compliance load error:', err);
      toast({ title: 'Failed to load compliance data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [fetchLogs, fetchAccounts, toast]);

  useEffect(() => { refresh(page); }, [page, refresh]);

  const setLogAction = async (log: ModerationLog, action: 'cleared' | 'warned') => {
    setActionBusy(log.id);
    const { error } = await supabase.from('moderation_logs').update({ action_taken: action }).eq('id', log.id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: action === 'cleared' ? 'Violation cleared' : 'User warned' });
      await refresh(page);
    }
    setActionBusy(null);
  };

  const setSuspended = async (userId: string, suspended: boolean) => {
    setActionBusy(userId);
    const { error } = await supabase.from('profiles').update({ suspended }).eq('id', userId);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: suspended ? 'Account suspended' : 'Account reinstated' });
      await refresh(page);
    }
    setActionBusy(null);
  };

  const clearReview = async (userId: string) => {
    setActionBusy(userId);
    const { error } = await supabase.from('profiles').update({ under_review: false }).eq('id', userId);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Review flag cleared' });
      await refresh(page);
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
      const rows = data || [];
      const header = ['id', 'user_id', 'agency_name', 'service_type', 'source', 'action_taken', 'flagged_categories', 'prompt', 'created_at'];
      const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = [
        header.join(','),
        ...rows.map(r => [
          r.id, r.user_id, r.agency_name, r.service_type, r.source, r.action_taken,
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

  const totalPages = Math.max(1, Math.ceil(totalLogs / PAGE_SIZE));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading compliance data…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Summary stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-800" data-testid="text-total-violations">{totalLogs}</p>
            <p className="text-xs text-stone-400">Total flagged attempts</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-800" data-testid="text-under-review-count">
              {accounts.filter(a => a.under_review && !a.suspended).length}
            </p>
            <p className="text-xs text-stone-400">Accounts under review</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
            <Ban className="w-5 h-5 text-stone-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-800" data-testid="text-suspended-count">
              {accounts.filter(a => a.suspended).length}
            </p>
            <p className="text-xs text-stone-400">Suspended accounts</p>
          </div>
        </div>
      </div>

      {/* ── Review Queue ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-stone-100">
          <div>
            <h3 className="font-semibold text-stone-800">Review Queue</h3>
            <p className="text-xs text-stone-400 mt-0.5">Blocked generation attempts, most recent first</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="h-8 text-xs rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50"
            data-testid="button-export-csv"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400">
              <ShieldCheck className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm">No violations logged</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  {['Agency', 'Prompt', 'Categories', 'Source', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-stone-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-stone-50/60 transition-colors" data-testid={`row-violation-${log.id}`}>
                    <td className="px-4 py-3 text-xs font-medium text-stone-700 whitespace-nowrap">
                      {log.agency_name || <span className="text-stone-400 font-mono">{log.user_id.slice(0, 8)}…</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500 max-w-[220px]">
                      <button
                        onClick={() => setDetail(log)}
                        className="truncate block max-w-full text-left hover:text-stone-800"
                        title="View full prompt"
                        data-testid={`button-view-prompt-${log.id}`}
                      >
                        {log.prompt}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {log.flagged_categories.slice(0, 2).map(cat => (
                          <span key={cat} className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                            {cat}
                          </span>
                        ))}
                        {log.flagged_categories.length > 2 && (
                          <span className="text-[10px] text-stone-400">+{log.flagged_categories.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SOURCE_CHIP[log.source] || 'bg-stone-100 text-stone-600'}`}>
                        {log.source}
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
                          onClick={() => setDetail(log)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {log.action_taken === 'blocked' && (
                          <>
                            <button
                              onClick={() => setLogAction(log, 'cleared')}
                              disabled={actionBusy === log.id}
                              className="p-1.5 rounded-lg text-green-500 hover:text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                              title="Clear (false positive)"
                              data-testid={`button-clear-${log.id}`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setLogAction(log, 'warned')}
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
          )}
        </div>
        {totalLogs > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-stone-100">
            <p className="text-xs text-stone-400">
              Page {page + 1} of {totalPages} · {totalLogs} records
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline" size="sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="h-7 w-7 p-0 rounded-lg border-stone-200"
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="h-7 w-7 p-0 rounded-lg border-stone-200"
                data-testid="button-next-page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Flagged Accounts ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h3 className="font-semibold text-stone-800">Flagged Accounts</h3>
          <p className="text-xs text-stone-400 mt-0.5">Accounts with violations, under review, or suspended</p>
        </div>
        <div className="overflow-x-auto">
          {accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400">
              <ShieldCheck className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm">No flagged accounts</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  {['Account', 'Agency', 'Violations (30d window)', 'Status', 'Last Violation', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-stone-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {accounts.map(acc => {
                  const name = `${acc.first_name || ''} ${acc.last_name || ''}`.trim();
                  return (
                    <tr key={acc.user_id} className="hover:bg-stone-50/60 transition-colors" data-testid={`row-account-${acc.user_id}`}>
                      <td className="px-4 py-3 text-xs font-medium text-stone-700">
                        {name || <span className="font-mono text-stone-400">{acc.user_id.slice(0, 8)}…</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500">{acc.agency_name || '—'}</td>
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
                      <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap">
                        {acc.last_violation ? fmtDate(acc.last_violation) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {acc.under_review && (
                            <Button
                              variant="outline" size="sm"
                              disabled={actionBusy === acc.user_id}
                              onClick={() => clearReview(acc.user_id)}
                              className="h-6 text-[10px] px-2 rounded-lg border-stone-200 text-stone-600 hover:bg-stone-50"
                              data-testid={`button-clear-review-${acc.user_id}`}
                            >
                              Clear Review
                            </Button>
                          )}
                          {acc.suspended ? (
                            <Button
                              variant="outline" size="sm"
                              disabled={actionBusy === acc.user_id}
                              onClick={() => setSuspended(acc.user_id, false)}
                              className="h-6 text-[10px] px-2 rounded-lg border-green-200 text-green-600 hover:bg-green-50"
                              data-testid={`button-reinstate-${acc.user_id}`}
                            >
                              <ShieldCheck className="w-3 h-3 mr-1" /> Reinstate
                            </Button>
                          ) : (
                            <Button
                              variant="outline" size="sm"
                              disabled={actionBusy === acc.user_id}
                              onClick={() => setSuspended(acc.user_id, true)}
                              className="h-6 text-[10px] px-2 rounded-lg border-red-200 text-red-500 hover:bg-red-50"
                              data-testid={`button-suspend-${acc.user_id}`}
                            >
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
          )}
        </div>
      </div>

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
                  <p className="text-xs font-medium text-stone-400 mb-1">Agency</p>
                  <p className="text-xs text-stone-700">{detail.agency_name || '—'}</p>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
