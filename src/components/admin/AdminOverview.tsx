import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, ShoppingCart, Zap, Building2, TrendingUp, TrendingDown, ChevronRight, Package, AlertCircle } from 'lucide-react';
import ImageFallbackAlert from './ImageFallbackAlert';

interface Order {
  id: string;
  customer_name: string;
  customer_company: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  agency_id: string;
  agencyName?: string;
}

interface Stats {
  totalRevenue: number;
  activeOrders: number;
  totalOrders: number;
  aiGenerationsMonth: number;
  aiGenerationsTotal: number;
  activeAgencies: number;
  completedOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
}

interface AgencyWorkload {
  agencyName: string;
  count: number;
  color: string;
}

interface Task {
  id: string;
  text: string;
  type: 'order' | 'user' | 'generation';
  status: 'urgent' | 'normal' | 'info';
  time: string;
}

interface AdminOverviewProps {
  onNavigate: (section: string) => void;
}

const WORKLOAD_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899', '#22c55e'];

function ProgressRing({ progress, size = 28 }: { progress: number; size?: number }) {
  const r = (size - 4) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, progress)) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e6e9ee" strokeWidth="2.5" />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f97316" strokeWidth="2.5"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}

function SemiCircleGauge({ percentage }: { percentage: number }) {
  const cx = 100, cy = 100, r = 72;
  const pct = Math.min(100, Math.max(0, percentage));
  const angleToPoint = (deg: number) => ({
    x: cx + r * Math.cos((deg * Math.PI) / 180),
    y: cy + r * Math.sin((deg * Math.PI) / 180),
  });
  const bgStart = angleToPoint(180);
  const bgEnd = angleToPoint(360);
  const fillEndDeg = 180 + pct * 1.8;
  const fillEnd = angleToPoint(fillEndDeg);
  const fillLarge = pct > 50 ? 1 : 0;
  const bgPath = `M ${bgStart.x.toFixed(2)} ${bgStart.y.toFixed(2)} A ${r} ${r} 0 0 1 ${bgEnd.x.toFixed(2)} ${bgEnd.y.toFixed(2)}`;
  const fillPath = pct > 0
    ? `M ${bgStart.x.toFixed(2)} ${bgStart.y.toFixed(2)} A ${r} ${r} 0 ${fillLarge} 1 ${fillEnd.x.toFixed(2)} ${fillEnd.y.toFixed(2)}`
    : null;
  const gaugeColor = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f97316' : '#ef4444';
  return (
    <svg viewBox="0 0 200 115" className="w-full max-w-[220px] mx-auto">
      <defs>
        <linearGradient id="adminGaugeGrad" gradientUnits="userSpaceOnUse" x1="28" y1="100" x2="172" y2="100">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <path d={bgPath} fill="none" stroke="#e6e9ee" strokeWidth="14" strokeLinecap="round" />
      {fillPath && (
        <path d={fillPath} fill="none" stroke="url(#adminGaugeGrad)" strokeWidth="14" strokeLinecap="round" />
      )}
      {pct > 0 && (
        <circle cx={fillEnd.x} cy={fillEnd.y} r="7" fill={gaugeColor} stroke="white" strokeWidth="2" />
      )}
      {pct === 0 && (
        <circle cx={bgStart.x} cy={bgStart.y} r="7" fill="#e6e9ee" stroke="white" strokeWidth="2" />
      )}
      <text x="100" y="95" textAnchor="middle" fontSize="26" fontWeight="700" fill="#0a2540">{pct}%</text>
      <text x="100" y="110" textAnchor="middle" fontSize="9" fill="#697386">COMPLETION RATE</text>
    </svg>
  );
}

function StatCard({ icon: Icon, label, value, trend, trendLabel, iconBg, iconColor }: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: 'up' | 'down' | null;
  trendLabel: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(10,37,64,.06)] border border-[#e6e9ee]">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-[#0e9f6e]" />}
        {trend === 'down' && <TrendingDown className="w-4 h-4 text-[#ef4444]" />}
      </div>
      <p className="text-xs text-[#697386] font-medium mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-[#0a2540] leading-tight">{value}</p>
      <p className="text-[11px] text-[#697386] mt-1">{trendLabel}</p>
    </div>
  );
}

const STATUS_CONFIG: Record<string, { label: string; chip: string; progress: number }> = {
  completed:    { label: 'Completed',   chip: 'bg-[#def7ec] text-[#0e9f6e]',   progress: 100 },
  in_progress:  { label: 'In Progress', chip: 'bg-[#fff4ed] text-[#ea580c]',   progress: 60  },
  'in-progress':{ label: 'In Progress', chip: 'bg-[#fff4ed] text-[#ea580c]',   progress: 60  },
  processing:   { label: 'Processing',  chip: 'bg-[#e1effe] text-[#1c64f2]',   progress: 40  },
  pending:      { label: 'Pending',     chip: 'bg-[#eef2f7] text-[#697386]',   progress: 10  },
  cancelled:    { label: 'Cancelled',   chip: 'bg-[#fee2e2] text-[#ef4444]',   progress: 0   },
  delayed:      { label: 'Delayed',     chip: 'bg-[#fef9c3] text-[#ca8a04]',   progress: 30  },
  paid:         { label: 'Paid',        chip: 'bg-[#e1effe] text-[#1c64f2]',   progress: 80  },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || { label: status, chip: 'bg-[#eef2f7] text-[#697386]', progress: 20 };
}

function SkeletonBar({ w }: { w: string }) {
  return <div className={`h-3 ${w} bg-[#e6e9ee] rounded animate-pulse`} />;
}

export default function AdminOverview({ onNavigate }: AdminOverviewProps) {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0, activeOrders: 0, totalOrders: 0,
    aiGenerationsMonth: 0, aiGenerationsTotal: 0,
    activeAgencies: 0, completedOrders: 0, pendingOrders: 0, inProgressOrders: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workload, setWorkload] = useState<AgencyWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTaskTab, setActiveTaskTab] = useState<'all' | 'urgent' | 'info'>('all');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [ordersRes, aiMonthRes, agenciesRes] = await Promise.all([
        supabase.from('customer_orders').select('id, customer_name, customer_company, total_amount, status, created_at, agency_id').order('created_at', { ascending: false }).limit(50),
        supabase.from('ai_generations').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
        supabase.from('agency_settings').select('id, agency_name, user_id'),
      ]);

      const allOrders: Order[] = ordersRes.data || [];
      const agencies = agenciesRes.data || [];
      const agencyMap = new Map(agencies.map(a => [a.user_id, a.agency_name || 'Unknown Agency']));
      const enrichedOrders = allOrders.map(o => ({ ...o, agencyName: agencyMap.get(o.agency_id) || 'Unknown Agency' }));

      const completed = allOrders.filter(o => o.status === 'completed').length;
      const active = allOrders.filter(o => ['in_progress', 'in-progress', 'processing', 'pending'].includes(o.status)).length;
      const pending = allOrders.filter(o => o.status === 'pending').length;
      const inProgress = allOrders.filter(o => ['in_progress', 'in-progress', 'processing'].includes(o.status)).length;
      const revenue = allOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total_amount || 0), 0);

      setStats({ totalRevenue: revenue, activeOrders: active, totalOrders: allOrders.length, aiGenerationsMonth: aiMonthRes.count || 0, aiGenerationsTotal: 0, activeAgencies: agencies.length, completedOrders: completed, pendingOrders: pending, inProgressOrders: inProgress });
      setOrders(enrichedOrders);

      const wlMap = new Map<string, number>();
      enrichedOrders.forEach(o => { const name = o.agencyName || 'Unknown'; wlMap.set(name, (wlMap.get(name) || 0) + 1); });
      const wlArr: AgencyWorkload[] = Array.from(wlMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count], i) => ({ agencyName: name, count, color: WORKLOAD_COLORS[i % WORKLOAD_COLORS.length] }));
      setWorkload(wlArr);

      const taskList: Task[] = [];
      enrichedOrders.filter(o => o.status === 'pending').slice(0, 3).forEach(o => taskList.push({ id: o.id, text: `Review pending order from ${o.customer_name}`, type: 'order', status: 'urgent', time: new Date(o.created_at).toLocaleDateString() }));
      enrichedOrders.filter(o => ['in_progress', 'in-progress', 'processing'].includes(o.status)).slice(0, 2).forEach(o => taskList.push({ id: o.id + '-ip', text: `Follow up: ${o.customer_name} order in progress`, type: 'order', status: 'normal', time: new Date(o.created_at).toLocaleDateString() }));
      if ((aiMonthRes.count || 0) > 0) taskList.push({ id: 'ai-1', text: `${aiMonthRes.count} AI generations this month — review outputs`, type: 'generation', status: 'info', time: 'This month' });
      if (agencies.length > 0) taskList.push({ id: 'agency-1', text: `${agencies.length} agencies active on the platform`, type: 'user', status: 'info', time: 'Platform-wide' });
      setTasks(taskList);
    } catch (err) {
      console.error('AdminOverview fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
  const filteredTasks = activeTaskTab === 'all' ? tasks : tasks.filter(t => t.status === activeTaskTab);
  const completionPct = stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0;
  const maxWorkload = Math.max(1, ...workload.map(w => w.count));

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#e6e9ee] shadow-[0_1px_3px_rgba(10,37,64,.06)] p-5">
              <div className="w-10 h-10 rounded-xl bg-[#e6e9ee] animate-pulse mb-4" />
              <SkeletonBar w="w-12" />
              <div className="mt-2"><SkeletonBar w="w-20" /></div>
              <div className="mt-1"><SkeletonBar w="w-24" /></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#e6e9ee] shadow-[0_1px_3px_rgba(10,37,64,.06)] p-5">
              <div className="h-4 w-24 bg-[#e6e9ee] rounded animate-pulse mb-4" />
              <div className="space-y-3">{[...Array(4)].map((__, j) => <div key={j} className="h-8 bg-[#e6e9ee] rounded animate-pulse" />)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ImageFallbackAlert />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign}    label="Total Revenue"    value={`$${stats.totalRevenue.toFixed(2)}`}  trend="up"   trendLabel="From completed orders"   iconBg="bg-green-100"  iconColor="text-green-600" />
        <StatCard icon={ShoppingCart}  label="Active Orders"    value={String(stats.activeOrders)}            trend="up"   trendLabel={`${stats.totalOrders} total orders`}  iconBg="bg-blue-100"   iconColor="text-blue-600" />
        <StatCard icon={Zap}           label="AI Generations"   value={String(stats.aiGenerationsMonth)}      trend={null} trendLabel="This month"                          iconBg="bg-violet-100" iconColor="text-violet-600" />
        <StatCard icon={Building2}     label="Active Agencies"  value={String(stats.activeAgencies)}          trend={null} trendLabel="Agencies on platform"               iconBg="bg-orange-100" iconColor="text-orange-500" />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Completion gauge */}
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(10,37,64,.06)] border border-[#e6e9ee] p-5 flex flex-col items-center justify-center gap-3">
          <p className="text-sm font-semibold text-[#0a2540]">Order Completion Rate</p>
          <SemiCircleGauge percentage={completionPct} />
          <div className="grid grid-cols-3 gap-x-4 w-full max-w-[220px]">
            {[
              { label: 'Total',    val: stats.totalOrders,     color: 'text-[#0a2540]' },
              { label: 'Done',     val: stats.completedOrders, color: 'text-[#0e9f6e]' },
              { label: 'Pending',  val: stats.pendingOrders,   color: 'text-[#697386]' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex flex-col items-center">
                <span className={`text-xl font-bold ${color}`}>{val}</span>
                <span className="text-[10px] text-[#697386]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action tasks */}
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(10,37,64,.06)] border border-[#e6e9ee] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#e6e9ee]">
            <h3 className="font-semibold text-[#0a2540] text-sm">Action Items</h3>
            <div className="flex rounded-lg overflow-hidden border border-[#e6e9ee] text-[10px]">
              {(['all', 'urgent', 'info'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTaskTab(tab)}
                  className={`px-2.5 py-1 font-semibold capitalize transition-colors ${activeTaskTab === tab ? 'bg-[#0a1f33] text-white' : 'text-[#697386] hover:bg-[#f6f9fc]'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-xs text-[#697386]">No action items</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#e6e9ee]">
              {filteredTasks.map(task => (
                <li key={task.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[#fafcfe] transition-colors">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${task.status === 'urgent' ? 'bg-[#ef4444]' : task.status === 'info' ? 'bg-[#1c64f2]' : 'bg-orange-400'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#0a2540] font-medium leading-snug">{task.text}</p>
                    <p className="text-[10px] text-[#697386] mt-0.5">{task.time}</p>
                  </div>
                  {task.type === 'order' && (
                    <button onClick={() => onNavigate('orders')} className="text-orange-500 hover:text-orange-600 shrink-0">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Agency workload */}
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(10,37,64,.06)] border border-[#e6e9ee] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#e6e9ee]">
            <h3 className="font-semibold text-[#0a2540] text-sm">Agency Workload</h3>
            <button onClick={() => onNavigate('agencies')} className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-0.5 font-medium">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4">
            {workload.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-orange-400" />
                </div>
                <p className="text-xs text-[#697386]">No agency orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workload.map(item => (
                  <div key={item.agencyName}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#425466] truncate max-w-[160px] font-medium">{item.agencyName}</span>
                      <span className="text-xs font-bold text-[#0a2540] ml-2">{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-[#e6e9ee] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, (item.count / maxWorkload) * 100)}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent orders table */}
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(10,37,64,.06)] border border-[#e6e9ee] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#e6e9ee]">
          <div>
            <h3 className="font-semibold text-[#0a2540]">Recent Orders</h3>
            <p className="text-xs text-[#697386] mt-0.5">{filtered.length} orders shown</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs w-[130px] bg-[#f6f9fc] border-[#e6e9ee] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <button onClick={() => onNavigate('orders')} className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-0.5 font-medium">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#0a2540]">No orders found</p>
                <p className="text-xs text-[#697386] mt-0.5">Orders from agency customers will appear here.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f6f9fc] border-b border-[#e6e9ee]">
                  {['', 'Customer', 'Company', 'Agency', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#697386] tracking-wide uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6e9ee]">
                {filtered.slice(0, 20).map(order => {
                  const cfg = getStatusConfig(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-[#fafcfe] transition-colors">
                      <td className="px-4 py-3">
                        <ProgressRing progress={cfg.progress} size={24} />
                      </td>
                      <td className="px-4 py-3 font-medium text-[#0a2540] text-xs">{order.customer_name}</td>
                      <td className="px-4 py-3 text-xs text-[#697386]">{order.customer_company || '—'}</td>
                      <td className="px-4 py-3 text-xs text-[#425466]">{order.agencyName || 'Unknown'}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-[#0a2540]">${(order.total_amount || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.chip}`}>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#697386] whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
