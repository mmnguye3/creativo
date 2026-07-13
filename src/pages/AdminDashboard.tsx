import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard, Package, Building2, Sparkles, Users, Settings,
  Plus, Search, Bell, Menu, X, LogOut, ChevronRight, Zap,
  ShoppingCart, FileText, ExternalLink, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminOverview from '@/components/admin/AdminOverview';
import UserManagement from '@/components/admin/UserManagement';
import SubdomainManagement from '@/components/admin/SubdomainManagement';
import AdminCompliance from '@/components/admin/AdminCompliance';

type Section = 'overview' | 'orders' | 'agencies' | 'ai-generations' | 'users' | 'compliance' | 'settings';

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'overview',        label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'orders',          label: 'Orders',          icon: Package },
  { id: 'agencies',        label: 'Agencies',        icon: Building2 },
  { id: 'ai-generations',  label: 'AI Generations',  icon: Sparkles },
  { id: 'users',           label: 'Users',           icon: Users },
  { id: 'compliance',      label: 'Compliance',      icon: ShieldAlert },
  { id: 'settings',        label: 'Settings',        icon: Settings },
];

const SECTION_TITLES: Record<Section, string> = {
  overview:        'Dashboard Overview',
  orders:          'Orders',
  agencies:        'Agencies',
  'ai-generations': 'AI Generations',
  users:           'User Management',
  compliance:      'Content Compliance',
  settings:        'Settings',
};

interface AdminOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_company: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  agency_id: string;
  agencyName?: string;
}

interface AIGeneration {
  id: string;
  service_type: string;
  description: string;
  status: string;
  content_type: string;
  created_at: string;
  image_url: string | null;
}

const STATUS_CHIP: Record<string, string> = {
  completed:     'bg-[#def7ec] text-[#0e9f6e]',
  in_progress:   'bg-[#fff4ed] text-[#ea580c]',
  'in-progress': 'bg-[#fff4ed] text-[#ea580c]',
  processing:    'bg-[#e1effe] text-[#1c64f2]',
  pending:       'bg-[#eef2f7] text-[#697386]',
  cancelled:     'bg-[#fee2e2] text-[#ef4444]',
  delayed:       'bg-[#fef9c3] text-[#ca8a04]',
  draft:         'bg-[#eef2f7] text-[#697386]',
  failed:        'bg-[#fee2e2] text-[#ef4444]',
  paid:          'bg-[#e1effe] text-[#1c64f2]',
};

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function AllOrdersSection() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const [ordersRes, agenciesRes] = await Promise.all([
        supabase
          .from('customer_orders')
          .select('id, customer_name, customer_email, customer_company, total_amount, status, created_at, agency_id')
          .order('created_at', { ascending: false }),
        supabase.from('agency_settings').select('id, agency_name'),
      ]);
      if (ordersRes.error) throw ordersRes.error;
      const agencyMap = new Map((agenciesRes.data || []).map(a => [a.id, a.agency_name || 'Unknown']));
      setOrders((ordersRes.data || []).map(o => ({
        ...o,
        agencyName: agencyMap.get(o.agency_id) || 'Unknown',
      })));
    } catch (err: unknown) {
      toast({ title: 'Failed to load orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('customer_orders').update({ status }).eq('id', id);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast({ title: 'Status updated' });
    }
  };

  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

  if (loading) return (
    <div className="bg-white rounded-xl border border-[#e6e9ee] shadow-[0_1px_3px_rgba(10,37,64,.06)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e6e9ee]">
        <div className="h-4 w-28 bg-[#e6e9ee] rounded animate-pulse mb-1.5" />
        <div className="h-3 w-44 bg-[#e6e9ee] rounded animate-pulse" />
      </div>
      <div className="p-5 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-3 flex-1 bg-[#e6e9ee] rounded animate-pulse" />
            <div className="h-3 w-24 bg-[#e6e9ee] rounded animate-pulse" />
            <div className="h-3 w-16 bg-[#e6e9ee] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-[#e6e9ee] shadow-[0_1px_3px_rgba(10,37,64,.06)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6e9ee]">
        <div>
          <h3 className="font-semibold text-[#0a2540]">All Orders</h3>
          <p className="text-xs text-[#697386] mt-0.5">{orders.length} total orders across all agencies</p>
        </div>
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
      </div>
      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#0a2540]">No orders found</p>
              <p className="text-xs text-[#697386] mt-0.5">Orders will appear here once placed.</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f9fc] border-b border-[#e6e9ee]">
                {['Customer', 'Email', 'Company', 'Agency', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#697386] tracking-wide uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6e9ee]">
              {filtered.map(order => (
                <tr key={order.id} className="hover:bg-[#fafcfe] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#0a2540] text-xs">{order.customer_name}</td>
                  <td className="px-4 py-3 text-xs text-[#425466]">{order.customer_email}</td>
                  <td className="px-4 py-3 text-xs text-[#697386]">{order.customer_company || '—'}</td>
                  <td className="px-4 py-3 text-xs text-[#425466]" data-testid={`text-agency-${order.id}`}>{order.agencyName || 'Unknown'}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-[#0a2540]">${(order.total_amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_CHIP[order.status] || 'bg-[#eef2f7] text-[#697386]'}`}>
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#697386]">
                    {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <Select value={order.status} onValueChange={v => updateStatus(order.id, v)}>
                      <SelectTrigger className="h-6 text-[10px] w-[100px] bg-[#f6f9fc] border-[#e6e9ee] rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AIGenerationsSection() {
  const [generations, setGenerations] = useState<AIGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [preview, setPreview] = useState<AIGeneration | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('ai_generations')
        .select('id, service_type, description, status, content_type, created_at, image_url')
        .order('created_at', { ascending: false })
        .limit(100);
      setGenerations(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = generations.filter(g =>
    (statusFilter === 'all' || g.status === statusFilter) &&
    (typeFilter === 'all' || g.content_type === typeFilter)
  );

  if (loading) return (
    <div className="bg-white rounded-xl border border-[#e6e9ee] shadow-[0_1px_3px_rgba(10,37,64,.06)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e6e9ee]">
        <div className="h-4 w-32 bg-[#e6e9ee] rounded animate-pulse mb-1.5" />
        <div className="h-3 w-40 bg-[#e6e9ee] rounded animate-pulse" />
      </div>
      <div className="p-5 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-3 w-24 bg-[#e6e9ee] rounded animate-pulse" />
            <div className="h-3 flex-1 bg-[#e6e9ee] rounded animate-pulse" />
            <div className="h-3 w-14 bg-[#e6e9ee] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-white rounded-xl border border-[#e6e9ee] shadow-[0_1px_3px_rgba(10,37,64,.06)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#e6e9ee]">
          <div>
            <h3 className="font-semibold text-[#0a2540]">AI Generations</h3>
            <p className="text-xs text-[#697386] mt-0.5">{generations.length} total generations</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs w-[110px] bg-[#f6f9fc] border-[#e6e9ee] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs w-[110px] bg-[#f6f9fc] border-[#e6e9ee] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="combo">Combo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#0a2540]">No generations found</p>
                <p className="text-xs text-[#697386] mt-0.5">AI generations will appear here once created.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f6f9fc] border-b border-[#e6e9ee]">
                  {['Service', 'Description', 'Type', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#697386] tracking-wide uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6e9ee]">
                {filtered.slice(0, 50).map(g => (
                  <tr key={g.id} className="hover:bg-[#fafcfe] transition-colors">
                    <td className="px-4 py-3 text-xs font-medium text-[#0a2540] whitespace-nowrap">
                      {g.service_type?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#425466] max-w-[200px]">
                      <p className="truncate">{g.description || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] bg-[#eef2f7] text-[#697386] px-2 py-0.5 rounded-full font-medium">{g.content_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_CHIP[g.status] || 'bg-[#eef2f7] text-[#697386]'}`}>
                        {statusLabel(g.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#697386] whitespace-nowrap">
                      {new Date(g.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      {g.image_url && (
                        <button
                          onClick={() => setPreview(g)}
                          className="text-orange-500 hover:text-orange-600 transition-colors"
                          title="Preview image"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">{preview?.service_type?.replace(/-/g, ' ')}</DialogTitle>
          </DialogHeader>
          {preview?.image_url && (
            <img src={preview.image_url} alt="AI generated" className="w-full rounded-xl" />
          )}
          <p className="text-xs text-stone-500">{preview?.description}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SettingsSection() {
  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(10,37,64,.06)] border border-[#e6e9ee] p-6 max-w-2xl">
      <h3 className="font-semibold text-[#0a2540] mb-1">Platform Settings</h3>
      <p className="text-sm text-[#697386] mb-6">System configuration and platform health</p>
      <div className="space-y-1">
        {[
          { label: 'Database', status: 'Healthy' },
          { label: 'Authentication', status: 'Active' },
          { label: 'AI Services (OpenAI)', status: 'Operational' },
          { label: 'Edge Functions', status: 'Deployed' },
          { label: 'Storage', status: 'Available' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-3 border-b border-[#e6e9ee] last:border-0">
            <span className="text-sm text-[#425466] font-medium">{item.label}</span>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#def7ec] text-[#0e9f6e]">{item.status}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-[#e6e9ee]">
        <p className="text-xs text-[#697386]">Supabase Project: <span className="font-mono text-[#425466]">ukabvhdvfajudrtqnfpm</span></p>
        <p className="text-xs text-[#697386] mt-1">Region: US East (us-east-1)</p>
      </div>
    </div>
  );
}

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<{ firstName: string; lastName: string } | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/');
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) setProfile({ firstName: data.first_name || '', lastName: data.last_name || '' });
        });
    }
  }, [user]);

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    setSidebarCollapsed(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarCollapsed(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f9fc] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          <span className="text-[#697386]">Loading admin dashboard…</span>
        </div>
      </div>
    );
  }
  if (!user || !isAdmin) return null;

  const adminName = profile ? `${profile.firstName} ${profile.lastName}`.trim() || user.email?.split('@')[0] || 'Admin'
    : user.email?.split('@')[0] || 'Admin';
  const initials = adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';

  const handleNavigate = (section: string) => {
    setActiveSection(section as Section);
    setMobileSidebarOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`px-4 py-5 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
        {collapsed ? (
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm">C</span>
          </div>
        ) : (
          <img src="/cretivo-logo.png" alt="Cretivo" className="h-8 w-auto max-w-[140px] object-contain" />
        )}
      </div>

      {/* Create button */}
      <div className={`px-3 mb-5 ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={() => { handleNavigate('orders'); }}
          className={`flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-orange-500/25 ${
            collapsed ? 'w-10 h-10 justify-center p-0' : 'w-full px-4 py-2.5 text-sm'
          }`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Create new order</span>}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => handleNavigate(id)}
              className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 ${
                collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'
              } ${
                active
                  ? 'bg-white/[0.12] text-white font-semibold'
                  : 'text-[#9fb3c8] hover:text-white hover:bg-white/10'
              }`}
              title={collapsed ? label : undefined}
            >
              <Icon className={`shrink-0 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
              {!collapsed && <span className="text-sm">{label}</span>}
              {!collapsed && active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
            </button>
          );
        })}
      </nav>

      {/* User + Sign out */}
      <div className={`p-3 border-t border-white/10 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 mb-1">
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarFallback className="bg-orange-500 text-white text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{adminName}</p>
              <p className="text-[10px] text-[#9fb3c8]/70 truncate">Administrator</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={`flex items-center gap-2 text-[#9fb3c8] hover:text-red-400 transition-colors text-xs rounded-lg hover:bg-white/5 ${
            collapsed ? 'w-10 h-10 justify-center p-0' : 'w-full px-2 py-2'
          }`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <AdminOverview onNavigate={handleNavigate} />;
      case 'orders':
        return <AllOrdersSection />;
      case 'agencies':
        return (
          <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(10,37,64,.06)] border border-[#e6e9ee] p-5">
            <SubdomainManagement />
          </div>
        );
      case 'ai-generations':
        return <AIGenerationsSection />;
      case 'users':
        return (
          <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(10,37,64,.06)] border border-[#e6e9ee] p-5">
            <UserManagement />
          </div>
        );
      case 'compliance':
        return <AdminCompliance />;
      case 'settings':
        return <SettingsSection />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#f6f9fc] overflow-hidden">
      {/* ── Desktop / Tablet Sidebar ── */}
      <aside
        className={`hidden md:flex flex-col bg-[#0a1f33] flex-shrink-0 transition-all duration-300 h-screen sticky top-0 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative w-64 bg-[#0a1f33] h-full flex flex-col z-10 shadow-2xl">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent collapsed={false} />
          </aside>
        </div>
      )}

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex-shrink-0 h-16 bg-white border-b border-[#e6e9ee] flex items-center gap-3 px-4 md:px-6 shadow-[0_1px_2px_rgba(10,37,64,.04)]">
          {/* Toggle sidebar / mobile hamburger */}
          <button
            className="text-[#697386] hover:text-[#0a2540] transition-colors p-1.5 rounded-lg hover:bg-[#f6f9fc]"
            onClick={() => {
              if (window.innerWidth < 768) setMobileSidebarOpen(true);
              else setSidebarCollapsed(prev => !prev);
            }}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <h1 className="font-bold text-[#0a2540] text-base md:text-lg leading-none">
            {SECTION_TITLES[activeSection]}
          </h1>

          {/* Search */}
          <div className="flex-1 max-w-xs mx-auto hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9fb3c8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search…"
                className="w-full h-8 pl-9 pr-4 rounded-xl bg-[#f6f9fc] border border-[#e6e9ee] text-sm text-[#425466] placeholder:text-[#9fb3c8] focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative text-[#697386] hover:text-[#0a2540] transition-colors p-1.5 rounded-lg hover:bg-[#f6f9fc]">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
            </button>

            {/* Avatar + name */}
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-orange-500 text-white text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-[#0a2540] leading-tight">{adminName}</p>
                <p className="text-[10px] text-[#697386] leading-tight">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderSection()}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a1f33] border-t border-white/10 flex z-40">
        {NAV_ITEMS.slice(0, 5).map(({ id, label, icon: Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => handleNavigate(id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                active ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminDashboard;
