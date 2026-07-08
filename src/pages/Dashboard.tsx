import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LayoutDashboard, Sparkles, History, ShoppingCart,
  Building2, User, Plus, Search, Bell, Menu, X, LogOut,
  ChevronRight, Users,
} from 'lucide-react';
import { AIStudio } from '@/components/AIStudio';
import { GenerationHistory } from '@/components/GenerationHistory';
import { ClientProjects } from '@/components/ClientProjects';
import { OrderManagement } from '@/components/OrderManagement';
import AgencySettingsForm from '@/components/AgencySettingsForm';
import VendorOverview from '@/components/dashboard/VendorOverview';

type Section =
  | 'overview' | 'ai-studio' | 'history'
  | 'orders' | 'projects' | 'agency-settings' | 'profile';

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'overview',         label: 'Overview',        icon: LayoutDashboard },
  { id: 'ai-studio',        label: 'AI Studio',       icon: Sparkles },
  { id: 'history',          label: 'History',         icon: History },
  { id: 'orders',           label: 'Orders',          icon: ShoppingCart },
  { id: 'projects',         label: 'Client Projects', icon: Users },
  { id: 'agency-settings',  label: 'Agency Settings', icon: Building2 },
  { id: 'profile',          label: 'Profile',         icon: User },
];

const SECTION_TITLES: Record<Section, string> = {
  'overview':        'Dashboard',
  'ai-studio':       'AI Studio',
  'history':         'Generation History',
  'orders':          'Orders',
  'projects':        'Client Projects',
  'agency-settings': 'Agency Settings',
  'profile':         'Profile',
};

interface Profile {
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  phone: string | null;
}

/* ─── Inline Profile Section ─── */
function ProfileSection({ userId, userEmail }: { userId: string; userEmail: string }) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [updating, setUpdating] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data }) => {
        if (data) {
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setCompany(data.company || '');
          setPhone(data.phone || '');
        }
        setLoaded(true);
      });
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    const { error } = await supabase.from('profiles').upsert({
      id: userId, first_name: firstName, last_name: lastName, company, phone,
    });
    setUpdating(false);
    toast(error
      ? { title: 'Error updating profile', variant: 'destructive' }
      : { title: 'Profile updated' }
    );
  };

  if (!loaded) return <div className="flex justify-center py-16"><div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 max-w-xl">
      <h3 className="font-semibold text-stone-800 mb-1">Profile Information</h3>
      <p className="text-sm text-stone-400 mb-6">Update your personal information and preferences.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-stone-700 text-xs font-medium">First Name</Label>
            <Input value={firstName} onChange={e => setFirstName(e.target.value)}
              className="border-stone-200 focus-visible:ring-orange-400" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-stone-700 text-xs font-medium">Last Name</Label>
            <Input value={lastName} onChange={e => setLastName(e.target.value)}
              className="border-stone-200 focus-visible:ring-orange-400" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-stone-700 text-xs font-medium">Email</Label>
          <Input value={userEmail} disabled className="opacity-50 border-stone-200" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-stone-700 text-xs font-medium">Company / Agency Name</Label>
          <Input value={company} onChange={e => setCompany(e.target.value)}
            className="border-stone-200 focus-visible:ring-orange-400" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-stone-700 text-xs font-medium">Phone</Label>
          <Input value={phone} onChange={e => setPhone(e.target.value)}
            className="border-stone-200 focus-visible:ring-orange-400" />
        </div>
        <Button type="submit" disabled={updating}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6">
          {updating ? 'Saving…' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}

/* ─── Wrapper for existing dark components → light surface ─── */
function LightWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
      {children}
    </div>
  );
}

/* ─── Main Dashboard ─── */
const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('first_name, last_name, company, phone')
        .eq('id', user.id).single()
        .then(({ data }) => { if (data) setProfile(data); });
    }
  }, [user]);

  // Auto-collapse on tablet
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    setSidebarCollapsed(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarCollapsed(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F4] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          <span className="text-stone-500">Loading your dashboard…</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const firstName = profile?.first_name || '';
  const lastName = profile?.last_name || '';
  const company = profile?.company || '';
  const displayName = (firstName || lastName)
    ? `${firstName} ${lastName}`.trim()
    : user.email?.split('@')[0] || 'Vendor';
  const agencyName = company || displayName;
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase()
    || user.email?.[0]?.toUpperCase() || 'V';

  const handleNavigate = (section: string) => {
    setActiveSection(section as Section);
    setMobileSidebarOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <VendorOverview onNavigate={handleNavigate} />;
      case 'ai-studio':
        return <AIStudio />;
      case 'history':
        return <GenerationHistory onViewAdCampaign={() => handleNavigate('ai-studio')} />;
      case 'orders':
        return <OrderManagement />;
      case 'projects':
        return <ClientProjects />;
      case 'agency-settings':
        return <AgencySettingsForm />;
      case 'profile':
        return <ProfileSection userId={user.id} userEmail={user.email || ''} />;
      default:
        return null;
    }
  };

  /* ─── Sidebar inner content (shared between desktop + mobile drawer) ─── */
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

      {/* CTA — New Generation */}
      <div className={`px-3 mb-5 ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={() => handleNavigate('ai-studio')}
          className={`flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-orange-500/25 ${
            collapsed ? 'w-10 h-10 justify-center p-0' : 'w-full px-4 py-2.5 text-sm'
          }`}
          title={collapsed ? 'New Generation' : undefined}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>New Generation</span>}
        </button>
      </div>

      {/* Nav */}
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
                  ? 'bg-stone-100 text-stone-900 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
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

      {/* User + Sign Out */}
      <div className={`p-3 border-t border-white/10 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 mb-1">
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarFallback className="bg-orange-500 text-white text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-zinc-500 truncate">{agencyName !== displayName ? agencyName : user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={`flex items-center gap-2 text-zinc-500 hover:text-red-400 transition-colors text-xs rounded-lg hover:bg-white/5 ${
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

  return (
    <div className="flex h-screen bg-[#FDF8F4] overflow-hidden">
      {/* ── Desktop/Tablet Sidebar ── */}
      <aside
        className={`hidden md:flex flex-col bg-zinc-950 flex-shrink-0 transition-all duration-300 h-screen sticky top-0 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative w-64 bg-zinc-950 h-full flex flex-col z-10 shadow-2xl">
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

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex-shrink-0 h-16 bg-white border-b border-stone-100 flex items-center gap-3 px-4 md:px-6 shadow-sm">
          <button
            className="text-stone-400 hover:text-stone-700 transition-colors p-1.5 rounded-lg hover:bg-stone-100"
            onClick={() => {
              if (window.innerWidth < 768) setMobileSidebarOpen(true);
              else setSidebarCollapsed(prev => !prev);
            }}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="font-bold text-stone-800 text-base md:text-lg leading-none">
            {SECTION_TITLES[activeSection]}
          </h1>

          <div className="flex-1 max-w-xs mx-auto hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search…"
                className="w-full h-8 pl-9 pr-4 rounded-xl bg-stone-100 border border-stone-200 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="relative text-stone-400 hover:text-stone-700 transition-colors p-1.5 rounded-lg hover:bg-stone-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-orange-500 text-white text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-stone-800 leading-tight">{displayName}</p>
                <p className="text-[10px] text-stone-400 leading-tight">{agencyName !== displayName ? agencyName : 'Vendor'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {renderSection()}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-white/10 flex z-40">
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

export default Dashboard;
