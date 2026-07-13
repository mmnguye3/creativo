import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Megaphone, ShoppingCart, CheckCircle, ChevronRight, ImageIcon, Plus } from 'lucide-react';

interface VendorStats {
  generationsMonth: number;
  adCampaigns: number;
  activeOrders: number;
  completedOrders: number;
  totalOrders: number;
}

interface RecentGeneration {
  id: string;
  service_type: string;
  description: string | null;
  image_url: string | null;
  content_type: string;
  created_at: string;
}

interface RecentOrder {
  id: string;
  customer_name: string;
  customer_company: string | null;
  total_amount: number;
  status: string;
  created_at: string;
}

interface VendorOverviewProps {
  onNavigate: (section: string) => void;
}

const STATUS_CHIP: Record<string, string> = {
  completed:     'bg-[#def7ec] text-[#0e9f6e]',
  in_progress:   'bg-[#fff4ed] text-[#ea580c]',
  'in-progress': 'bg-[#fff4ed] text-[#ea580c]',
  processing:    'bg-[#e1effe] text-[#1c64f2]',
  pending:       'bg-[#eef2f7] text-[#697386]',
  cancelled:     'bg-[#fee2e2] text-[#ef4444]',
  paid:          'bg-[#e1effe] text-[#1c64f2]',
  delayed:       'bg-[#fef9c3] text-[#ca8a04]',
};

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

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
  const toPoint = (deg: number) => ({
    x: cx + r * Math.cos((deg * Math.PI) / 180),
    y: cy + r * Math.sin((deg * Math.PI) / 180),
  });
  const bgStart = toPoint(180);
  const bgEnd = toPoint(360);
  const fillEndDeg = 180 + pct * 1.8;
  const fillEnd = toPoint(fillEndDeg);
  const fillLarge = pct > 50 ? 1 : 0;
  const bgPath = `M ${bgStart.x.toFixed(2)} ${bgStart.y.toFixed(2)} A ${r} ${r} 0 0 1 ${bgEnd.x.toFixed(2)} ${bgEnd.y.toFixed(2)}`;
  const fillPath = pct > 0
    ? `M ${bgStart.x.toFixed(2)} ${bgStart.y.toFixed(2)} A ${r} ${r} 0 ${fillLarge} 1 ${fillEnd.x.toFixed(2)} ${fillEnd.y.toFixed(2)}`
    : null;
  const needleDot = toPoint(fillEndDeg);
  return (
    <svg viewBox="0 0 200 115" className="w-full max-w-[200px] mx-auto">
      <defs>
        <linearGradient id="vendorGaugeGrad" gradientUnits="userSpaceOnUse" x1="28" y1="100" x2="172" y2="100">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <path d={bgPath} fill="none" stroke="#e6e9ee" strokeWidth="14" strokeLinecap="round" />
      {fillPath && (
        <path d={fillPath} fill="none" stroke="url(#vendorGaugeGrad)" strokeWidth="14" strokeLinecap="round" />
      )}
      {pct > 0 && (
        <circle cx={needleDot.x.toFixed(2)} cy={needleDot.y.toFixed(2)} r="6" fill="white"
          stroke={pct >= 70 ? '#22c55e' : pct >= 40 ? '#f97316' : '#ef4444'} strokeWidth="3" />
      )}
      <text x="100" y="108" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#0a2540">{Math.round(pct)}%</text>
    </svg>
  );
}

const STAT_CARDS = [
  { key: 'generationsMonth', label: 'AI Generations', sub: 'this month',  icon: Sparkles,    iconBg: 'bg-violet-100', iconColor: 'text-violet-600', nav: 'history' },
  { key: 'adCampaigns',      label: 'Ad Campaigns',   sub: 'total',       icon: Megaphone,   iconBg: 'bg-orange-100', iconColor: 'text-orange-500', nav: 'ai-studio' },
  { key: 'activeOrders',     label: 'Active Orders',  sub: 'in progress', icon: ShoppingCart,iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   nav: 'orders' },
  { key: 'completedOrders',  label: 'Completed',      sub: 'all time',    icon: CheckCircle, iconBg: 'bg-green-100',  iconColor: 'text-green-600',  nav: 'orders' },
] as const;

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#e6e9ee] shadow-[0_1px_3px_rgba(10,37,64,.06)] p-5">
      <div className="w-10 h-10 rounded-xl bg-[#e6e9ee] animate-pulse mb-4" />
      <div className="h-7 w-12 bg-[#e6e9ee] rounded animate-pulse mb-2" />
      <div className="h-3 w-24 bg-[#e6e9ee] rounded animate-pulse mb-1" />
      <div className="h-3 w-16 bg-[#e6e9ee] rounded animate-pulse" />
    </div>
  );
}

const VendorOverview: React.FC<VendorOverviewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<VendorStats>({ generationsMonth: 0, adCampaigns: 0, activeOrders: 0, completedOrders: 0, totalOrders: 0 });
  const [recentGens, setRecentGens] = useState<RecentGeneration[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const monthStart = new Date();
      monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

      const [gensMonth, adCamps, allGens, agencyRes] = await Promise.all([
        supabase.from('ai_generations').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart.toISOString()),
        supabase.from('ai_generations').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('service_type', 'ad-campaign'),
        supabase.from('ai_generations').select('id, service_type, description, image_url, content_type, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
        supabase.from('agency_settings').select('id').eq('user_id', user.id).maybeSingle(),
      ]);

      setRecentGens(allGens.data || []);

      const agencyId = agencyRes.data ? user.id : null;
      if (agencyId) {
        const [activeRes, completedRes, recentOrdersRes] = await Promise.all([
          supabase.from('customer_orders').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).in('status', ['pending', 'in_progress', 'in-progress', 'processing']),
          supabase.from('customer_orders').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).eq('status', 'completed'),
          supabase.from('customer_orders').select('id, customer_name, customer_company, total_amount, status, created_at').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(5),
        ]);
        const active = activeRes.count || 0;
        const completed = completedRes.count || 0;
        setStats({ generationsMonth: gensMonth.count || 0, adCampaigns: adCamps.count || 0, activeOrders: active, completedOrders: completed, totalOrders: active + completed });
        setRecentOrders(recentOrdersRes.data || []);
      } else {
        setStats({ generationsMonth: gensMonth.count || 0, adCampaigns: adCamps.count || 0, activeOrders: 0, completedOrders: 0, totalOrders: 0 });
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const completionPct = stats.totalOrders > 0 ? (stats.completedOrders / stats.totalOrders) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#e6e9ee] shadow-[0_1px_3px_rgba(10,37,64,.06)] p-5">
              <div className="h-4 w-32 bg-[#e6e9ee] rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[...Array(4)].map((__, j) => (
                  <div key={j} className="h-8 bg-[#e6e9ee] rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, sub, icon: Icon, iconBg, iconColor, nav }) => (
          <button
            key={key}
            onClick={() => onNavigate(nav)}
            className="bg-white rounded-xl border border-[#e6e9ee] shadow-[0_1px_3px_rgba(10,37,64,.06)] p-5 text-left
                       hover:shadow-[0_8px_24px_rgba(10,37,64,.08)] hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <p className="text-2xl font-bold text-[#0a2540] leading-tight">{stats[key]}</p>
            <p className="text-xs font-semibold text-[#425466] mt-1">{label}</p>
            <p className="text-[10px] text-[#697386]">{sub}</p>
          </button>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Generations */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-[0_1px_3px_rgba(10,37,64,.06)] border border-[#e6e9ee] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#e6e9ee]">
            <h3 className="font-semibold text-[#0a2540] text-sm">Recent Generations</h3>
            <button onClick={() => onNavigate('history')} className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-0.5 font-medium">
              See all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {recentGens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 px-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#0a2540]">No generations yet</p>
                <p className="text-xs text-[#697386] mt-0.5">Create your first AI content to get started.</p>
              </div>
              <button
                onClick={() => onNavigate('ai-studio')}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New Generation
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 p-3">
              {recentGens.map(g => (
                <button
                  key={g.id}
                  onClick={() => onNavigate('history')}
                  className="aspect-square rounded-xl overflow-hidden bg-[#f6f9fc] hover:ring-2 hover:ring-orange-400 transition-all group relative"
                  title={g.service_type?.replace(/-/g, ' ')}
                >
                  {g.image_url ? (
                    <img src={g.image_url} alt={g.description || g.service_type} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-[#9fb3c8]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Gauge */}
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(10,37,64,.06)] border border-[#e6e9ee] p-4 flex flex-col items-center justify-center gap-2">
          <p className="text-sm font-semibold text-[#0a2540]">Order Completion</p>
          <SemiCircleGauge percentage={completionPct} />
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 w-full max-w-[200px] mt-1">
            {[
              { label: 'Total',     val: stats.totalOrders,     color: 'text-[#0a2540]' },
              { label: 'Done',      val: stats.completedOrders, color: 'text-[#0e9f6e]' },
              { label: 'Active',    val: stats.activeOrders,    color: 'text-orange-500' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex flex-col items-center">
                <span className={`text-lg font-bold ${color}`}>{val}</span>
                <span className="text-[10px] text-[#697386]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(10,37,64,.06)] border border-[#e6e9ee] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#e6e9ee]">
            <h3 className="font-semibold text-[#0a2540] text-sm">Recent Orders</h3>
            <button onClick={() => onNavigate('orders')} className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-0.5 font-medium">
              See all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 px-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#0a2540]">No orders yet</p>
                <p className="text-xs text-[#697386] mt-0.5">Orders from your agency site will appear here.</p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-[#e6e9ee]">
              {recentOrders.map(order => {
                const pct = order.status === 'completed' ? 100
                  : order.status === 'in_progress' || order.status === 'in-progress' || order.status === 'processing' ? 55
                  : order.status === 'pending' ? 10 : 0;
                return (
                  <li key={order.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafcfe] transition-colors">
                    <ProgressRing progress={pct} size={26} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#0a2540] truncate">{order.customer_name}</p>
                      <p className="text-[10px] text-[#697386] truncate">{order.customer_company || '—'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${STATUS_CHIP[order.status] || 'bg-[#eef2f7] text-[#697386]'}`}>
                        {statusLabel(order.status)}
                      </span>
                      <span className="text-[10px] text-[#697386] font-medium">${(order.total_amount || 0).toFixed(2)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorOverview;
