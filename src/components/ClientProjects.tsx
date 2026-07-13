// ClientProjects — 3-level Agency CRM
//   Level 1: Clients list  (grouped by customer_email)
//   Level 2: Client orders  (all orders for one client)
//   Level 3: Order detail   (status pipeline, priority, due date, notes, timeline)
//
// Named export used by Dashboard.tsx:
//   import { ClientProjects } from '@/components/ClientProjects';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ChevronRight, Users, Calendar, Package, MessageSquare,
  Activity, Send, Loader2, Building, Mail, Phone,
  CheckCircle2, ExternalLink,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface InternalNote { at: string; by: string; content: string; }

interface OrderActivityRow {
  id: string;
  event_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_company: string | null;
  total_amount: number;
  status: string;
  payment_status: string;
  notes: string | null;
  internal_notes: InternalNote[];
  due_date: string | null;
  priority: string | null;
  created_at: string;
  agency_id: string;
  stripe_payment_url?: string | null;
  deliverable_files?: Array<{ path: string; name: string; size?: number }>;
}

interface Client {
  email: string;
  name: string;
  company: string | null;
  phone: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  orders: Order[];
  statusCounts: Record<string, number>;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PIPELINE = ['pending', 'paid', 'in_progress', 'delivered'] as const;

const STATUS_LABEL: Record<string, string> = {
  pending:     'Pending',
  paid:        'Paid',
  in_progress: 'In Progress',
  delivered:   'Delivered',
  cancelled:   'Cancelled',
};

const STATUS_DOT: Record<string, string> = {
  pending:     'bg-zinc-500',
  paid:        'bg-blue-400',
  in_progress: 'bg-orange-400',
  delivered:   'bg-emerald-400',
  cancelled:   'bg-red-500',
};

const STATUS_BADGE: Record<string, string> = {
  pending:     'bg-zinc-800 text-zinc-300 border-zinc-700',
  paid:        'bg-blue-950/60 text-blue-300 border-blue-800',
  in_progress: 'bg-orange-950/60 text-orange-300 border-orange-800',
  delivered:   'bg-emerald-950/60 text-emerald-300 border-emerald-800',
  cancelled:   'bg-red-950/60 text-red-300 border-red-800',
};

const PRIORITY_COLOR: Record<string, string> = {
  low:    'text-zinc-400',
  medium: 'text-blue-400',
  high:   'text-amber-400',
  urgent: 'text-red-400',
};

const ACTIVITY_EMOJI: Record<string, string> = {
  paid:           '💳',
  status_changed: '🔄',
  note_added:     '📝',
  delivered:      '📦',
  created:        '✨',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function fmtMoney(n: number) {
  return `$${Number(n).toFixed(2)}`;
}

function groupOrdersByClient(orders: Order[]): Client[] {
  const map = new Map<string, Client>();
  for (const o of orders) {
    const key = o.customer_email.toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        email: o.customer_email,
        name: o.customer_name,
        company: o.customer_company,
        phone: o.customer_phone,
        orderCount: 0,
        totalSpent: 0,
        lastOrderDate: o.created_at,
        orders: [],
        statusCounts: {},
      });
    }
    const c = map.get(key)!;
    c.orderCount++;
    c.totalSpent += Number(o.total_amount);
    if (o.created_at > c.lastOrderDate) c.lastOrderDate = o.created_at;
    c.orders.push(o);
    c.statusCounts[o.status] = (c.statusCounts[o.status] ?? 0) + 1;
  }
  return Array.from(map.values()).sort((a, b) => b.lastOrderDate.localeCompare(a.lastOrderDate));
}

// ── Level 1: Clients List ─────────────────────────────────────────────────────
function ClientsList({ clients, onSelect }: { clients: Client[]; onSelect: (c: Client) => void }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => clients.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.company ?? '').toLowerCase().includes(search.toLowerCase())
    ),
    [clients, search],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Clients</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            {clients.length} client{clients.length !== 1 ? 's' : ''} &middot;{' '}
            {clients.reduce((s, c) => s + c.orderCount, 0)} orders total
          </p>
        </div>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search clients…"
          className="max-w-56 bg-zinc-900 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
          data-testid="input-client-search"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-10 h-10 text-zinc-700 mb-3" />
          <p className="text-zinc-400 font-medium">
            {clients.length === 0 ? 'No client orders yet' : 'No clients match your search'}
          </p>
          <p className="text-zinc-600 text-sm mt-1">
            {clients.length === 0
              ? 'Orders placed through your agency site will appear here.'
              : 'Try a different search term.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(client => (
            <button
              key={client.email}
              onClick={() => onSelect(client)}
              data-testid={`card-client-${client.email}`}
              className="w-full text-left bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4 hover:border-orange-500/30 hover:bg-zinc-900 transition-all group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                    <span className="text-orange-400 font-bold text-sm">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{client.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{client.email}</p>
                  </div>
                  {client.company && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                      <Building className="w-3 h-3" />{client.company}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-semibold text-white">{fmtMoney(client.totalSpent)}</p>
                    <p className="text-xs text-zinc-500">{client.orderCount} order{client.orderCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="hidden sm:flex gap-1.5 items-center">
                    {Object.entries(client.statusCounts).slice(0, 4).map(([s, n]) => (
                      <span
                        key={s}
                        title={`${n} ${STATUS_LABEL[s] ?? s}`}
                        className={`w-2 h-2 rounded-full ${STATUS_DOT[s] ?? 'bg-zinc-500'}`}
                      />
                    ))}
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-orange-400 transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Level 2: Client Orders ────────────────────────────────────────────────────
function ClientOrders({
  client, onSelect,
}: { client: Client; onSelect: (o: Order) => void }) {
  return (
    <div className="space-y-4">
      {/* Client header */}
      <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
              <span className="text-orange-400 font-bold text-base">
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{client.name}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-zinc-400">
                  <Mail className="w-3 h-3" />{client.email}
                </span>
                {client.phone && (
                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                    <Phone className="w-3 h-3" />{client.phone}
                  </span>
                )}
                {client.company && (
                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                    <Building className="w-3 h-3" />{client.company}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-white">{fmtMoney(client.totalSpent)}</p>
            <p className="text-xs text-zinc-500">{client.orderCount} order{client.orderCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Orders */}
      {client.orders.length === 0 ? (
        <p className="text-zinc-500 text-sm py-8 text-center">No orders for this client.</p>
      ) : (
        <div className="space-y-2">
          {client.orders.map(order => (
            <button
              key={order.id}
              onClick={() => onSelect(order)}
              data-testid={`card-order-${order.id}`}
              className="w-full text-left bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4 hover:border-orange-500/30 hover:bg-zinc-900 transition-all group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-zinc-500">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_BADGE[order.status] ?? STATUS_BADGE.pending}`}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                      {order.priority && (
                        <span className={`text-xs font-medium ${PRIORITY_COLOR[order.priority] ?? 'text-zinc-400'}`}>
                          ▲ {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-500">{fmtDate(order.created_at)}</span>
                      {order.due_date && (
                        <span className="flex items-center gap-0.5 text-xs text-zinc-500">
                          <Calendar className="w-3 h-3" /> Due {fmtDate(order.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-white">{fmtMoney(order.total_amount)}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-orange-400 transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Level 3: Order Detail ─────────────────────────────────────────────────────
function OrderDetail({
  order, activities, actLoading,
  updatingStatus, updatingField,
  noteText, savingNote,
  onUpdateStatus, onUpdateField, onNoteChange, onAddNote,
}: {
  order: Order;
  activities: OrderActivityRow[];
  actLoading: boolean;
  updatingStatus: boolean;
  updatingField: string | null;
  noteText: string;
  savingNote: boolean;
  onUpdateStatus: (s: string) => void;
  onUpdateField: (f: 'priority' | 'due_date', v: string) => void;
  onNoteChange: (s: string) => void;
  onAddNote: () => void;
}) {
  const stepIndex = PIPELINE.indexOf(order.status as typeof PIPELINE[number]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-zinc-500">#{order.id.slice(0, 8).toUpperCase()}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_BADGE[order.status] ?? STATUS_BADGE.pending}`}>
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">{order.customer_name}</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="flex items-center gap-1 text-xs text-zinc-400"><Mail className="w-3 h-3" />{order.customer_email}</span>
              {order.customer_phone && <span className="flex items-center gap-1 text-xs text-zinc-400"><Phone className="w-3 h-3" />{order.customer_phone}</span>}
              {order.customer_company && <span className="flex items-center gap-1 text-xs text-zinc-400"><Building className="w-3 h-3" />{order.customer_company}</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-white">{fmtMoney(order.total_amount)}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Placed {fmtDate(order.created_at)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Status Pipeline */}
          <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Pipeline</h3>
            <div className="flex items-center">
              {PIPELINE.map((stage, i) => {
                const isComplete = i <= stepIndex;
                const isCurrent  = i === stepIndex;
                return (
                  <div key={stage} className="flex-1 flex items-center">
                    <button
                      onClick={() => !updatingStatus && onUpdateStatus(stage)}
                      disabled={updatingStatus}
                      title={`Set to ${STATUS_LABEL[stage]}`}
                      data-testid={`btn-pipeline-${stage}`}
                      className={[
                        'flex flex-col items-center gap-1 flex-1 py-2 px-1 rounded-lg transition-all',
                        isCurrent  ? 'bg-orange-500/20 border border-orange-500/40 cursor-default' : '',
                        !isCurrent ? 'hover:bg-zinc-800 cursor-pointer' : '',
                        updatingStatus ? 'opacity-50 cursor-wait' : '',
                        !isComplete && !isCurrent ? 'opacity-40' : '',
                      ].join(' ')}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isComplete ? (isCurrent ? 'bg-orange-400' : 'bg-emerald-400') : 'bg-zinc-600'}`} />
                      <span className={`text-[9px] font-semibold leading-tight text-center ${isCurrent ? 'text-orange-300' : isComplete ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        {STATUS_LABEL[stage]}
                      </span>
                    </button>
                    {i < PIPELINE.length - 1 && (
                      <div className={`h-px w-2 mx-0.5 shrink-0 ${i < stepIndex ? 'bg-emerald-500/40' : 'bg-zinc-700'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            {updatingStatus && (
              <p className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving…
              </p>
            )}
          </div>

          {/* Priority + Due Date */}
          <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Priority</Label>
              <div className="relative">
                <Select
                  value={order.priority ?? ''}
                  onValueChange={v => onUpdateField('priority', v)}
                  disabled={updatingField === 'priority'}
                >
                  <SelectTrigger className="bg-zinc-800 border-white/10 text-white h-9 text-sm" data-testid="select-priority">
                    <SelectValue placeholder="Not set" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  </SelectContent>
                </Select>
                {updatingField === 'priority' && (
                  <Loader2 className="absolute right-2 top-2.5 w-4 h-4 animate-spin text-zinc-400 pointer-events-none" />
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Due Date</Label>
              <div className="relative">
                <Input
                  type="date"
                  defaultValue={order.due_date ?? ''}
                  onBlur={e => onUpdateField('due_date', e.target.value)}
                  className="bg-zinc-800 border-white/10 text-white h-9 text-sm"
                  disabled={updatingField === 'due_date'}
                  data-testid="input-due-date"
                />
                {updatingField === 'due_date' && (
                  <Loader2 className="absolute right-2 top-2.5 w-4 h-4 animate-spin text-zinc-400 pointer-events-none" />
                )}
              </div>
            </div>
          </div>

          {/* Customer note / payment link */}
          {(order.notes || order.stripe_payment_url) && (
            <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4 space-y-3">
              {order.stripe_payment_url && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Payment Link</p>
                  <a
                    href={order.stripe_payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />Open checkout link
                  </a>
                </div>
              )}
              {order.notes && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Customer Note</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{order.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Internal Notes */}
          <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Internal Notes</h3>
              <span className="ml-auto text-xs text-zinc-600">
                {order.internal_notes.length} note{order.internal_notes.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex gap-2 mb-4">
              <Textarea
                value={noteText}
                onChange={e => onNoteChange(e.target.value)}
                placeholder="Add a private note — only your team can see this…"
                rows={2}
                className="flex-1 bg-zinc-800 border-white/10 text-white placeholder:text-zinc-600 text-sm resize-none focus-visible:ring-orange-500"
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onAddNote(); }}
                data-testid="textarea-internal-note"
              />
              <Button
                onClick={onAddNote}
                disabled={savingNote || !noteText.trim()}
                size="sm"
                className="self-end bg-orange-500 hover:bg-orange-600 text-white border-0"
                data-testid="button-save-note"
              >
                {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>

            {order.internal_notes.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">No internal notes yet. Add one above.</p>
            ) : (
              <div className="space-y-3">
                {[...order.internal_notes].reverse().map((note, i) => (
                  <div key={i} className="border-l-2 border-orange-500/30 pl-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-zinc-400">{note.by}</span>
                      <span className="text-[10px] text-zinc-600">{fmtTime(note.at)}</span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: activity + deliverables */}
        <div className="space-y-4">
          {/* Activity Timeline */}
          <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Activity</h3>
            </div>

            {actLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">No activity recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((act, i) => (
                  <div key={act.id} className="relative flex gap-3">
                    {i < activities.length - 1 && (
                      <div className="absolute left-3 top-6 bottom-0 w-px bg-zinc-800" />
                    )}
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-[10px]">
                      {ACTIVITY_EMOJI[act.event_type] ?? '•'}
                    </div>
                    <div className="min-w-0 pb-1">
                      <p className="text-xs text-zinc-300 leading-snug">{act.description}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{fmtTime(act.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deliverables */}
          {order.deliverable_files && order.deliverable_files.length > 0 && (
            <div className="bg-zinc-900/60 border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Deliverables ({order.deliverable_files.length})
                </h3>
              </div>
              <div className="space-y-2">
                {order.deliverable_files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Package className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="text-zinc-300 truncate">{f.name}</span>
                    {f.size != null && (
                      <span className="text-[10px] text-zinc-600 shrink-0">
                        {(f.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Root exported component ───────────────────────────────────────────────────
export function ClientProjects() {
  const { toast } = useToast();

  const [agencyId,       setAgencyId]       = useState<string | null>(null);
  const [agencyUserId,   setAgencyUserId]   = useState<string | null>(null);
  const [allOrders,      setAllOrders]      = useState<Order[]>([]);
  const [loading,        setLoading]        = useState(true);

  const [level,          setLevel]          = useState<'clients' | 'orders' | 'detail'>('clients');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedOrder,  setSelectedOrder]  = useState<Order | null>(null);

  const [activities,     setActivities]     = useState<OrderActivityRow[]>([]);
  const [actLoading,     setActLoading]     = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingField,  setUpdatingField]  = useState<string | null>(null);
  const [noteText,       setNoteText]       = useState('');
  const [savingNote,     setSavingNote]     = useState(false);

  useEffect(() => { bootstrap(); }, []);

  async function bootstrap() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setAgencyUserId(user.id);
      const { data: ag } = await supabase
        .from('agency_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!ag) return;
      setAgencyId(ag.id);
      await fetchOrders(ag.id);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrders(agId: string) {
    const { data, error } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('agency_id', agId)
      .order('created_at', { ascending: false });
    if (error) { console.error('[ClientProjects]', error); return; }
    setAllOrders(
      (data ?? []).map((o: any) => ({
        ...o,
        internal_notes: Array.isArray(o.internal_notes) ? o.internal_notes : [],
      })) as Order[]
    );
  }

  async function refreshOrder(orderId: string) {
    const { data } = await supabase.from('customer_orders').select('*').eq('id', orderId).single();
    if (!data) return;
    const refreshed: Order = {
      ...(data as any),
      internal_notes: Array.isArray((data as any).internal_notes) ? (data as any).internal_notes : [],
    };
    setSelectedOrder(refreshed);
    setAllOrders(prev => prev.map(o => o.id === orderId ? refreshed : o));
    setSelectedClient(prev => prev
      ? { ...prev, orders: prev.orders.map(o => o.id === orderId ? refreshed : o) }
      : prev
    );
  }

  async function fetchActivities(orderId: string) {
    setActLoading(true);
    try {
      const { data } = await (supabase as any)
        .from('order_activity')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      setActivities((data ?? []) as OrderActivityRow[]);
    } finally {
      setActLoading(false);
    }
  }

  const clients = useMemo(() => groupOrdersByClient(allOrders), [allOrders]);

  // ── Navigation ────────────────────────────────────────────────────────────
  function jumpToClients() {
    setLevel('clients'); setSelectedClient(null); setSelectedOrder(null); setActivities([]);
  }
  function handleSelectClient(c: Client) { setSelectedClient(c); setLevel('orders'); }
  function handleSelectOrder(o: Order)   { setSelectedOrder(o); fetchActivities(o.id); setLevel('detail'); }

  // ── Status update ─────────────────────────────────────────────────────────
  async function handleUpdateStatus(newStatus: string) {
    if (!selectedOrder || !agencyUserId) return;
    const old = selectedOrder.status;
    if (old === newStatus) return;
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('customer_orders')
        .update({ status: newStatus })
        .eq('id', selectedOrder.id);
      if (error) throw error;
      await (supabase as any).from('order_activity').insert({
        order_id:       selectedOrder.id,
        agency_user_id: agencyUserId,
        event_type:     'status_changed',
        description:    `Status changed from "${STATUS_LABEL[old] ?? old}" to "${STATUS_LABEL[newStatus] ?? newStatus}"`,
        metadata:       { old_status: old, new_status: newStatus },
      });
      await refreshOrder(selectedOrder.id);
      await fetchActivities(selectedOrder.id);
      toast({ title: 'Status updated' });
    } catch (err: any) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    } finally {
      setUpdatingStatus(false);
    }
  }

  // ── Field update ──────────────────────────────────────────────────────────
  async function handleUpdateField(field: 'priority' | 'due_date', value: string) {
    if (!selectedOrder) return;
    setUpdatingField(field);
    try {
      const { error } = await supabase
        .from('customer_orders')
        .update({ [field]: value || null })
        .eq('id', selectedOrder.id);
      if (error) throw error;
      await refreshOrder(selectedOrder.id);
      toast({ title: 'Saved' });
    } catch (err: any) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    } finally {
      setUpdatingField(null);
    }
  }

  // ── Add note ──────────────────────────────────────────────────────────────
  async function handleAddNote() {
    if (!selectedOrder || !noteText.trim() || !agencyUserId) return;
    setSavingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const note: InternalNote = {
        at:      new Date().toISOString(),
        by:      user?.email ?? agencyUserId,
        content: noteText.trim(),
      };
      const current = selectedOrder.internal_notes ?? [];
      const { error } = await supabase
        .from('customer_orders')
        .update({ internal_notes: [...current, note] })
        .eq('id', selectedOrder.id);
      if (error) throw error;
      await (supabase as any).from('order_activity').insert({
        order_id:       selectedOrder.id,
        agency_user_id: agencyUserId,
        event_type:     'note_added',
        description:    'Internal note added',
        metadata:       { preview: noteText.trim().slice(0, 120) },
      });
      setNoteText('');
      await refreshOrder(selectedOrder.id);
      await fetchActivities(selectedOrder.id);
      toast({ title: 'Note saved' });
    } catch (err: any) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    } finally {
      setSavingNote(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      {level !== 'clients' && (
        <nav className="flex items-center gap-1.5 text-sm" aria-label="breadcrumb">
          <button onClick={jumpToClients} className="text-zinc-500 hover:text-white transition-colors">
            Clients
          </button>
          {selectedClient && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-700" />
              <button
                onClick={() => level === 'detail' ? (setLevel('orders'), setSelectedOrder(null), setActivities([])) : undefined}
                className={`transition-colors ${level === 'detail' ? 'text-zinc-500 hover:text-white' : 'text-white font-medium'}`}
              >
                {selectedClient.name}
              </button>
            </>
          )}
          {selectedOrder && level === 'detail' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-700" />
              <span className="text-white font-medium">
                #{selectedOrder.id.slice(0, 8).toUpperCase()}
              </span>
            </>
          )}
        </nav>
      )}

      {level === 'clients' && (
        <ClientsList clients={clients} onSelect={handleSelectClient} />
      )}
      {level === 'orders' && selectedClient && (
        <ClientOrders
          client={selectedClient}
          onSelect={handleSelectOrder}
        />
      )}
      {level === 'detail' && selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          activities={activities}
          actLoading={actLoading}
          updatingStatus={updatingStatus}
          updatingField={updatingField}
          noteText={noteText}
          savingNote={savingNote}
          onUpdateStatus={handleUpdateStatus}
          onUpdateField={handleUpdateField}
          onNoteChange={setNoteText}
          onAddNote={handleAddNote}
        />
      )}
    </div>
  );
}
