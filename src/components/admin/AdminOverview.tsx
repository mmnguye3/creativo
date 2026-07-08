import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ShoppingCart, Zap, Building2, TrendingUp, TrendingDown, CheckCircle, Clock, AlertCircle, Circle, ChevronRight } from 'lucide-react';

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
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
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
        <linearGradient id="gaugeGrad" gradientUnits="userSpaceOnUse" x1="28" y1="100" x2="172" y2="100">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <path d={bgPath} fill="none" stroke="#E5E7EB" strokeWidth="14" strokeLinecap="round" />
      {fillPath && (
        <path d={fillPath} fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round" />
      )}
      {/* Needle dot */}
      {pct > 0 && (
        <circle cx={fillEnd.x} cy={fillEnd.y} r="7" fill={gaugeColor} stroke="white" strokeWidth="2" />
      )}
      {pct === 0 && (
        <circle cx={bgStart.x} cy={bgStart.y} r="7" fill="#e5e7eb" stroke="white" strokeWidth="2" />
      )}
      <text x="100" y="95" textAnchor="middle" fontSize="26" fontWeight="700" fill="#111827">
        {pct}%
      </text>
      <text x="100" y="110" textAnchor="middle" fontSize="9" fill="#9ca3af">
        COMPLETION RATE
      </text>
    </svg>
  );
}

function StatCard({ icon: Icon, label, value, trend, trendLabel, chipColor }: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: 'up' | 'down' | null;
  trendLabel: string;
  chipColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${chipColor}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
        {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
      </div>
      <p className="text-xs text-stone-500 font-medium mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-stone-900 leading-tight">{value}</p>
      <p className="text-[11px] text-stone-400 mt-1">{trendLabel}</p>
    </div>
  );
}

const STATUS_CONFIG: Record<string, { label: string; className: string; progress: number }> = {
  completed:   { label: 'Completed',   className: 'bg-green-100 text-green-700',  progress: 100 },
  in_progress: { label: 'In Progress', className: 'bg-orange-100 text-orange-700', progress: 60 },
  'in-progress':{ label: 'In Progress', className: 'bg-orange-100 text-orange-700', progress: 60 },
  processing:  { label: 'Processing',  className: 'bg-blue-100 text-blue-700',    progress: 40 },
  pending:     { label: 'Pending',     className: 'bg-stone-100 text-stone-600',   progress: 10 },
  cancelled:   { label: 'Cancelled',   className: 'bg-red-100 text-red-600',       progress: 0 },
  delayed:     { label: 'Delayed',     className: 'bg-yellow-100 text-yellow-700', progress: 30 },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || { label: status, className: 'bg-stone-100 text-stone-600', progress: 20 };
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

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [ordersRes, aiAllRes, aiMonthRes, agenciesRes] = await Promise.all([
        supabase.from('customer_orders').select('id, customer_name, customer_company, total_amount, status, created_at, agency_id').order('created_at', { ascending: false }).limit(50),
        supabase.from('ai_generations').select('id, status, created_at, description, service_type', { count: 'exact', head: false }).limit(5),
        supabase.from('ai_generations').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
        supabase.from('agency_settings').select('id, agency_name, user_id'),
      ]);

      const allOrders: Order[] = ordersRes.data || [];
      const agencies = agenciesRes.data || [];

      // Enrich orders with agency names
      const agencyMap = new Map(agencies.map(a => [a.id, a.agency_name || 'Unknown Agency']));

      // Also need to match agency_id from orders to agency_settings.id
      const enrichedOrders = allOrders.map(o => ({
        ...o,
        agencyName: agencyMap.get(o.agency_id) || 'Unknown Agency',
      }));

      const completed = allOrders.filter(o => o.status === 'completed').length;
      const active = allOrders.filter(o => ['in_progress', 'in-progress', 'processing', 'pending'].includes(o.status)).length;
      const pending = allOrders.filter(o => o.status === 'pending').length;
      const inProgress = allOrders.filter(o => ['in_progress', 'in-progress', 'processing'].includes(o.status)).length;
      const revenue = allOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total_amount || 0), 0);

      setStats({
        totalRevenue: revenue,
        activeOrders: active,
        totalOrders: allOrders.length,
        aiGenerationsMonth: aiMonthRes.count || 0,
        aiGenerationsTotal: 0,
        activeAgencies: agencies.length,
        completedOrders: completed,
        pendingOrders: pending,
        inProgressOrders: inProgress,
      });

      setOrders(enrichedOrders);

      // Workload: count orders per agency
      const wlMap = new Map<string, number>();
      enrichedOrders.forEach(o => {
        const name = o.agencyName || 'Unknown';
        wlMap.set(name, (wlMap.get(name) || 0) + 1);
      });
      const wlArr: AgencyWorkload[] = Array.from(wlMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count], i) => ({ agencyName: name, count, color: WORKLOAD_COLORS[i % WORKLOAD_COLORS.length] }));
      setWorkload(wlArr);

      // Build tasks
      const taskList: Task[] = [];
      const pendingOrders = enrichedOrders.filter(o => o.status === 'pending').slice(0, 3);
      pendingOrders.forEach(o => taskList.push({
        id: o.id,
        text: `Review pending order from ${o.customer_name}`,
        type: 'order',
        status: 'urgent',
        time: new Date(o.created_at).toLocaleDateString(),
      }));
      const inProgressOrders2 = enrichedOrders.filter(o => ['in_progress', 'in-progress', 'processing'].includes(o.status)).slice(0, 2);
      inProgressOrders2.forEach(o => taskList.push({
        id: o.id + '-ip',
        text: `Follow up: ${o.customer_name} order in progress`,
        type: 'order',
        status: 'normal',
        time: new Date(o.created_at).toLocaleDateString(),
      }));
      if ((aiMonthRes.count || 0) > 0) {
        taskList.push({
          id: 'ai-1',
          text: `${aiMonthRes.count} AI generations this month — review outputs`,
          type: 'generation',
          status: 'info',
          time: 'This month',
        });
      }
      if (agencies.length > 0) {
        taskList.push({
          id: 'agency-1',
          text: `${agencies.length} active agencies — check onboarding status`,
          type: 'user',
          status: 'info',
          time: 'Now',
        });
      }
      setTasks(taskList);
    } catch (err) {
      console.error('AdminOverview fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
  const completionPct = stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0;
  const maxWorkload = workload.reduce((m, w) => Math.max(m, w.count), 1);

  const filteredTasks = activeTaskTab === 'all' ? tasks
    : activeTaskTab === 'urgent' ? tasks.filter(t => t.status === 'urgent')
    : tasks.filter(t => t.status === 'info');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          <span className="text-stone-500 text-sm">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign} label="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          trend={stats.totalRevenue > 0 ? 'up' : null}
          trendLabel={`From ${stats.completedOrders} completed order${stats.completedOrders !== 1 ? 's' : ''}`}
          chipColor="bg-orange-500"
        />
        <StatCard
          icon={ShoppingCart} label="Active Orders"
          value={`${stats.activeOrders}`}
          trend={stats.activeOrders > 0 ? 'up' : null}
          trendLabel={`${stats.totalOrders} total orders`}
          chipColor="bg-violet-500"
        />
        <StatCard
          icon={Zap} label="AI Gens This Month"
          value={`${stats.aiGenerationsMonth}`}
          trend={stats.aiGenerationsMonth > 0 ? 'up' : null}
          trendLabel="Content generated"
          chipColor="bg-blue-500"
        />
        <StatCard
          icon={Building2} label="Active Agencies"
          value={`${stats.activeAgencies}`}
          trend={stats.activeAgencies > 0 ? 'up' : null}
          trendLabel="White-label sites"
          chipColor="bg-emerald-500"
        />
      </div>

      {/* Middle row: Order Summary + Progress Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Order Summary Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <h3 className="font-semibold text-stone-800 text-sm">Order Summary</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 text-xs w-[120px] bg-stone-50 border-stone-200 rounded-lg">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <button
                onClick={() => onNavigate('orders')}
                className="flex items-center gap-1 text-xs text-orange-500 font-medium hover:text-orange-600 transition-colors"
              >
                See all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No orders yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-stone-400 whitespace-nowrap">Order</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-stone-400 whitespace-nowrap hidden sm:table-cell">Agency / Client</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-stone-400 whitespace-nowrap hidden md:table-cell">Date</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-stone-400">Status</th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium text-stone-400 hidden sm:table-cell">Progress</th>
                    <th className="text-right px-5 py-2.5 text-xs font-medium text-stone-400">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {filteredOrders.slice(0, 8).map((order) => {
                    const sc = getStatusConfig(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-stone-800 text-xs truncate max-w-[120px]">{order.customer_name}</p>
                          {order.customer_company && (
                            <p className="text-[11px] text-stone-400 truncate max-w-[120px]">{order.customer_company}</p>
                          )}
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <p className="text-xs text-stone-600 truncate max-w-[100px]">{order.agencyName}</p>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <p className="text-xs text-stone-400">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${sc.className}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <div className="flex items-center justify-center">
                            <ProgressRing progress={sc.progress} />
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <p className="text-xs font-semibold text-stone-800">${(order.total_amount || 0).toFixed(0)}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Overall Progress Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex flex-col">
          <h3 className="font-semibold text-stone-800 text-sm mb-4">Overall Progress</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <SemiCircleGauge percentage={completionPct} />
            <div className="grid grid-cols-2 gap-3 mt-4 w-full">
              <div className="text-center">
                <p className="text-xl font-bold text-stone-900">{stats.totalOrders}</p>
                <p className="text-[11px] text-stone-400">Total</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-600">{stats.completedOrders}</p>
                <p className="text-[11px] text-stone-400">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-orange-500">{stats.inProgressOrders}</p>
                <p className="text-[11px] text-stone-400">Ongoing</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-stone-500">{stats.pendingOrders}</p>
                <p className="text-[11px] text-stone-400">Pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Today's Tasks + Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Tasks */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <h3 className="font-semibold text-stone-800 text-sm mb-3">Action Items</h3>
            <div className="flex gap-1">
              {(['all', 'urgent', 'info'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTaskTab(tab)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                    activeTaskTab === tab
                      ? 'bg-orange-500 text-white'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-stone-50">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-stone-400">
                <CheckCircle className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs">All caught up!</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 px-5 py-3 hover:bg-stone-50/70 transition-colors">
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    task.status === 'urgent' ? 'border-orange-400 bg-orange-50' :
                    task.status === 'info' ? 'border-blue-400 bg-blue-50' :
                    'border-stone-300 bg-stone-50'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-700 leading-snug">{task.text}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{task.time}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                    task.status === 'urgent' ? 'bg-red-100 text-red-600' :
                    task.status === 'info' ? 'bg-blue-100 text-blue-600' :
                    'bg-stone-100 text-stone-500'
                  }`}>
                    {task.status === 'urgent' ? 'Urgent' : task.status === 'info' ? 'Info' : 'Normal'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Workload Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-semibold text-stone-800 text-sm">Orders per Agency</h3>
            <button
              onClick={() => onNavigate('agencies')}
              className="text-xs text-orange-500 font-medium hover:text-orange-600 flex items-center gap-0.5"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-5">
            {workload.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-stone-400">
                <Building2 className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs">No agency orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workload.map((item) => (
                  <div key={item.agencyName}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-stone-600 truncate max-w-[160px] font-medium">{item.agencyName}</span>
                      <span className="text-xs font-bold text-stone-800 ml-2">{item.count}</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(8, (item.count / maxWorkload) * 100)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
                {/* Playful stacked circles summary */}
                <div className="mt-4 pt-4 border-t border-stone-100 flex items-end gap-2">
                  {workload.slice(0, 5).map((item, i) => {
                    const barH = Math.max(20, Math.round((item.count / maxWorkload) * 60));
                    return (
                      <div key={i} className="flex flex-col items-center gap-1 flex-1">
                        <span className="text-[10px] font-bold text-stone-600">{item.count}</span>
                        <div className="flex flex-col gap-0.5 items-center">
                          {Array.from({ length: Math.min(item.count, 5) }).map((_, ci) => (
                            <div
                              key={ci}
                              className="w-4 h-4 rounded-full opacity-90"
                              style={{ backgroundColor: item.color }}
                            />
                          ))}
                        </div>
                        <span className="text-[9px] text-stone-400 text-center truncate w-full leading-tight">
                          {item.agencyName.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
