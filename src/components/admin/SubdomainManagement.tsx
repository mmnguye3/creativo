import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ExternalLink, CheckCircle2, Copy, Loader2, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Subdomain {
  id: string;
  subdomain: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  user_email?: string;
  agency_name?: string;
}

interface User {
  id: string;
  email: string;
}

interface AgencySettingsForm {
  agency_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  contact_email: string;
  contact_phone: string;
  hero_title: string;
  hero_subtitle: string;
  about_content: string;
  services_enabled: boolean;
  features_enabled: boolean;
  testimonials_enabled: boolean;
  pricing_enabled: boolean;
  meta_title: string;
  meta_description: string;
  favicon_url: string;
  hide_powered_by: boolean;
}

const SubdomainManagement = () => {
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSubdomain, setEditingSubdomain] = useState<Subdomain | null>(null);
  const [newSubdomain, setNewSubdomain] = useState({ subdomain: '', user_id: '' });

  // ── Add Agency dialog state ────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ agencyName: '', email: '', slug: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addResult, setAddResult] = useState<{
    tempPassword: string; emailSent: boolean; email: string; slug: string;
  } | null>(null);
  const [showTempPw, setShowTempPw] = useState(false);

  // Agency settings form state
  const [agencySettings, setAgencySettings] = useState<AgencySettingsForm>({
    agency_name: '',
    logo_url: '',
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
    contact_email: '',
    contact_phone: '',
    hero_title: 'Professional Design Services',
    hero_subtitle: 'Transform your business with our expert team',
    about_content: '',
    services_enabled: true,
    features_enabled: true,
    testimonials_enabled: true,
    pricing_enabled: true,
    meta_title: '',
    meta_description: '',
    favicon_url: '',
    hide_powered_by: false,
  });

  const fetchSubdomains = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const { data: subdomainData, error: subdomainError } = await supabase
        .from('agency_subdomains')
        .select('*')
        .order('created_at', { ascending: false });

      if (subdomainError) {
        throw subdomainError;
      }

      // Get user details and agency settings using the admin function
      const response = await fetch(`https://ukabvhdvfajudrtqnfpm.supabase.co/functions/v1/admin-list-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      const { data: agencySettings, error: settingsError } = await supabase
        .from('agency_settings')
        .select('user_id, agency_name');

      let authUsers = { users: [] }
      if (response.ok) {
        const responseData = await response.json()
        authUsers = { users: responseData.users || [] }
      }

      const subdomainsWithDetails = subdomainData.map(subdomain => {
        const user = authUsers.users.find((u: any) => u.id === subdomain.user_id);
        const settings = agencySettings?.find((s: any) => s.user_id === subdomain.user_id);
        
        return {
          ...subdomain,
          user_email: user?.email || 'Unknown',
          agency_name: settings?.agency_name || 'Not set'
        };
      });

      setSubdomains(subdomainsWithDetails);
    } catch (error: any) {
      console.error('Error fetching subdomains:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subdomains",
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch(`https://ukabvhdvfajudrtqnfpm.supabase.co/functions/v1/admin-list-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch users')
      }

      const { users: fetchedUsers } = await response.json()
      const userList = fetchedUsers.map((user: any) => ({
        id: user.id,
        email: user.email || ''
      }))

      setUsers(userList)
    } catch (error: any) {
      console.error('Error fetching users:', error)
    }
  };

  const handleAddAgency = async () => {
    const { agencyName, email, slug } = addForm;

    if (!agencyName.trim() || !email.trim() || !slug.trim()) {
      toast({ title: 'All fields are required', variant: 'destructive' });
      return;
    }

    const cleanSlug = slug.trim().toLowerCase();
    if (
      !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(cleanSlug) ||
      cleanSlug.length < 2 ||
      cleanSlug.length > 63
    ) {
      toast({
        title: 'Invalid slug',
        description: 'Use 2–63 lowercase letters, numbers, or hyphens (no leading/trailing hyphens).',
        variant: 'destructive',
      });
      return;
    }

    if (subdomains.some(s => s.subdomain === cleanSlug)) {
      toast({ title: 'Slug already taken', description: `"${cleanSlug}" is already in use.`, variant: 'destructive' });
      return;
    }

    setAddLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-agency', {
        body: { agencyName: agencyName.trim(), email: email.trim(), slug: cleanSlug },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'Failed to create agency');

      setAddResult({
        tempPassword: data.tempPassword,
        emailSent:    data.emailSent,
        email:        data.email,
        slug:         data.slug,
      });
      fetchSubdomains();
    } catch (err: any) {
      toast({ title: 'Failed to create agency', description: err.message, variant: 'destructive' });
    } finally {
      setAddLoading(false);
    }
  };

  const closeAddDialog = () => {
    setAddOpen(false);
    setAddResult(null);
    setAddForm({ agencyName: '', email: '', slug: '' });
    setShowTempPw(false);
  };

  const createSubdomain = async () => {
    if (!newSubdomain.subdomain || !newSubdomain.user_id) {
      toast({
        title: "Error",
        description: "URL slug and user are required",
        variant: "destructive",
      });
      return;
    }

    const slugValue = newSubdomain.subdomain.toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slugValue) || slugValue.length < 2 || slugValue.length > 63) {
      toast({
        title: "Invalid URL slug",
        description: "Slug must be 2–63 characters, lowercase letters, numbers, and hyphens only (no leading/trailing hyphens).",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create subdomain
      const { data: subdomainData, error: subdomainError } = await supabase
        .from('agency_subdomains')
        .insert({
          subdomain: newSubdomain.subdomain.toLowerCase(),
          user_id: newSubdomain.user_id
        })
        .select()
        .single();

      if (subdomainError) throw subdomainError;

      // Create or update agency settings with all fields
      const { error: settingsError } = await supabase
        .from('agency_settings')
        .upsert({
          user_id: newSubdomain.user_id,
          ...agencySettings,
        }, { onConflict: 'user_id' });

      if (settingsError) throw settingsError;

      toast({
        title: "Success",
        description: "Agency created successfully",
      });

      setCreateDialogOpen(false);
      setNewSubdomain({ subdomain: '', user_id: '' });
      setAgencySettings({
        agency_name: '',
        logo_url: '',
        primary_color: '#6366f1',
        secondary_color: '#8b5cf6',
        contact_email: '',
        contact_phone: '',
        hero_title: 'Professional Design Services',
        hero_subtitle: 'Transform your business with our expert team',
        about_content: '',
        services_enabled: true,
        features_enabled: true,
        testimonials_enabled: true,
        pricing_enabled: true,
        meta_title: '',
        meta_description: '',
        favicon_url: '',
        hide_powered_by: false,
      });
      fetchSubdomains();
    } catch (error: any) {
      console.error('Error creating subdomain:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create subdomain",
        variant: "destructive",
      });
    }
  };

  const loadAgencySettings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('agency_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setAgencySettings({
          agency_name: data.agency_name || '',
          logo_url: data.logo_url || '',
          primary_color: data.primary_color || '#6366f1',
          secondary_color: data.secondary_color || '#8b5cf6',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          hero_title: data.hero_title || 'Professional Design Services',
          hero_subtitle: data.hero_subtitle || 'Transform your business with our expert team',
          about_content: data.about_content || '',
          services_enabled: data.services_enabled ?? true,
          features_enabled: data.features_enabled ?? true,
          testimonials_enabled: data.testimonials_enabled ?? true,
          pricing_enabled: data.pricing_enabled ?? true,
          meta_title: data.meta_title || '',
          meta_description: data.meta_description || '',
          favicon_url: data.favicon_url || '',
          hide_powered_by: data.hide_powered_by ?? false,
        });
      }
    } catch (error) {
      console.error('Error loading agency settings:', error);
    }
  };

  const handleEdit = async (subdomain: Subdomain) => {
    setEditingSubdomain(subdomain);
    await loadAgencySettings(subdomain.user_id);
    setEditDialogOpen(true);
  };

  const updateSubdomain = async () => {
    if (!editingSubdomain) return;

    try {
      // Update agency settings
      const { error: settingsError } = await supabase
        .from('agency_settings')
        .upsert({
          user_id: editingSubdomain.user_id,
          ...agencySettings,
        }, { onConflict: 'user_id' });

      if (settingsError) throw settingsError;

      toast({
        title: "Success",
        description: "Agency settings updated successfully",
      });

      setEditDialogOpen(false);
      setEditingSubdomain(null);
      fetchSubdomains();
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const toggleSubdomainStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('agency_subdomains')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `Subdomain ${isActive ? 'activated' : 'deactivated'} successfully`,
      });

      fetchSubdomains();
    } catch (error: any) {
      console.error('Error updating subdomain status:', error);
      toast({
        title: "Error",
        description: "Failed to update subdomain status",
        variant: "destructive",
      });
    }
  };

  const deleteSubdomain = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agency_subdomains')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Subdomain deleted successfully",
      });

      fetchSubdomains();
    } catch (error: any) {
      console.error('Error deleting subdomain:', error);
      toast({
        title: "Error",
        description: "Failed to delete subdomain",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchSubdomains(), fetchUsers()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading subdomains...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Agencies ({subdomains.length})</h3>
        
        {/* ADD AGENCY DIALOG — atomic: creates login + all agency records in one shot */}
        <Dialog open={addOpen} onOpenChange={(open) => { if (!open) closeAddDialog(); else setAddOpen(true); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-agency">
              <Plus className="h-4 w-4 mr-2" />
              Add Agency
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{addResult ? 'Agency Created!' : 'Add New Agency'}</DialogTitle>
              <DialogDescription>
                {addResult
                  ? 'The agency account has been fully provisioned.'
                  : 'Creates a login account, subdomain, and settings in one step.'}
              </DialogDescription>
            </DialogHeader>

            {addResult ? (
              /* ── SUCCESS STATE ─────────────────────────────────────────────── */
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-emerald-800">Account provisioned</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      {addResult.email} &nbsp;·&nbsp; /{addResult.slug}
                    </p>
                  </div>
                </div>

                {addResult.emailSent ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
                    ✉️ Welcome email with credentials sent to <strong>{addResult.email}</strong>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <p className="text-sm font-semibold text-amber-800 mb-0.5">⚠️ Email failed — share credentials manually</p>
                    <p className="text-xs text-amber-700">Copy the temporary password below and send it to the agency owner.</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Temporary Password</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-mono bg-muted border rounded px-3 py-2 text-sm tracking-wider select-all">
                      {showTempPw ? addResult.tempPassword : '••••••••••••••••'}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => setShowTempPw(v => !v)}
                      title={showTempPw ? 'Hide' : 'Show'}
                    >
                      {showTempPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(addResult!.tempPassword);
                        toast({ title: 'Copied to clipboard' });
                      }}
                      title="Copy password"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  The agency will be prompted to set a permanent password on first login.
                </p>

                <div className="flex justify-end pt-1">
                  <Button onClick={closeAddDialog} data-testid="button-add-agency-done">
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              /* ── FORM STATE ───────────────────────────────────────────────── */
              <div className="space-y-4 pt-1">
                <div>
                  <Label htmlFor="add-agency-name">Agency Name *</Label>
                  <Input
                    id="add-agency-name"
                    value={addForm.agencyName}
                    onChange={e => setAddForm(f => ({ ...f, agencyName: e.target.value }))}
                    placeholder="Acme Design Co."
                    data-testid="input-add-agency-name"
                    autoFocus
                  />
                </div>

                <div>
                  <Label htmlFor="add-agency-email">Email Address *</Label>
                  <Input
                    id="add-agency-email"
                    type="email"
                    value={addForm.email}
                    onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="owner@acmedesign.com"
                    data-testid="input-add-agency-email"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A temporary password and login instructions will be emailed to this address.
                  </p>
                </div>

                <div>
                  <Label htmlFor="add-agency-slug">Site URL Slug *</Label>
                  <Input
                    id="add-agency-slug"
                    value={addForm.slug}
                    onChange={e =>
                      setAddForm(f => ({
                        ...f,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      }))
                    }
                    placeholder="acme"
                    data-testid="input-add-agency-slug"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Agency site:{' '}
                    <span className="font-mono">
                      {window.location.origin}/{addForm.slug || 'slug'}
                    </span>
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" onClick={closeAddDialog}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddAgency}
                    disabled={addLoading}
                    data-testid="button-add-agency-submit"
                  >
                    {addLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      'Create Agency'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* EDIT DIALOG */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Agency Settings</DialogTitle>
            <DialogDescription>
              Update agency branding for: {editingSubdomain?.subdomain}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[70vh] pr-4">
            <Tabs defaultValue="branding" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>

              {/* Same tabs content as create dialog */}
              <TabsContent value="branding" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="edit_agency_name">Agency Name</Label>
                  <Input
                    id="edit_agency_name"
                    value={agencySettings.agency_name}
                    onChange={(e) => setAgencySettings({ ...agencySettings, agency_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_logo_url">Logo URL</Label>
                  <Input
                    id="edit_logo_url"
                    value={agencySettings.logo_url}
                    onChange={(e) => setAgencySettings({ ...agencySettings, logo_url: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_primary_color">Primary Color</Label>
                    <Input
                      id="edit_primary_color"
                      type="color"
                      value={agencySettings.primary_color}
                      onChange={(e) => setAgencySettings({ ...agencySettings, primary_color: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_secondary_color">Secondary Color</Label>
                    <Input
                      id="edit_secondary_color"
                      type="color"
                      value={agencySettings.secondary_color}
                      onChange={(e) => setAgencySettings({ ...agencySettings, secondary_color: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_contact_email">Contact Email</Label>
                    <Input
                      id="edit_contact_email"
                      type="email"
                      value={agencySettings.contact_email}
                      onChange={(e) => setAgencySettings({ ...agencySettings, contact_email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_contact_phone">Contact Phone</Label>
                    <Input
                      id="edit_contact_phone"
                      value={agencySettings.contact_phone}
                      onChange={(e) => setAgencySettings({ ...agencySettings, contact_phone: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="edit_hero_title">Hero Title</Label>
                  <Input
                    id="edit_hero_title"
                    value={agencySettings.hero_title}
                    onChange={(e) => setAgencySettings({ ...agencySettings, hero_title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_hero_subtitle">Hero Subtitle</Label>
                  <Textarea
                    id="edit_hero_subtitle"
                    value={agencySettings.hero_subtitle}
                    onChange={(e) => setAgencySettings({ ...agencySettings, hero_subtitle: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_about_content">About Content</Label>
                  <Textarea
                    id="edit_about_content"
                    value={agencySettings.about_content}
                    onChange={(e) => setAgencySettings({ ...agencySettings, about_content: e.target.value })}
                    rows={4}
                  />
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Services Section</Label>
                    <p className="text-sm text-muted-foreground">Display services</p>
                  </div>
                  <Switch
                    checked={agencySettings.services_enabled}
                    onCheckedChange={(checked) => setAgencySettings({ ...agencySettings, services_enabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Features Section</Label>
                    <p className="text-sm text-muted-foreground">Display features</p>
                  </div>
                  <Switch
                    checked={agencySettings.features_enabled}
                    onCheckedChange={(checked) => setAgencySettings({ ...agencySettings, features_enabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Testimonials Section</Label>
                    <p className="text-sm text-muted-foreground">Display testimonials</p>
                  </div>
                  <Switch
                    checked={agencySettings.testimonials_enabled}
                    onCheckedChange={(checked) => setAgencySettings({ ...agencySettings, testimonials_enabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Pricing Section</Label>
                    <p className="text-sm text-muted-foreground">Display pricing</p>
                  </div>
                  <Switch
                    checked={agencySettings.pricing_enabled}
                    onCheckedChange={(checked) => setAgencySettings({ ...agencySettings, pricing_enabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Hide "Powered By"</Label>
                    <p className="text-sm text-muted-foreground">Remove branding</p>
                  </div>
                  <Switch
                    checked={agencySettings.hide_powered_by}
                    onCheckedChange={(checked) => setAgencySettings({ ...agencySettings, hide_powered_by: checked })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="edit_meta_title">Meta Title</Label>
                  <Input
                    id="edit_meta_title"
                    value={agencySettings.meta_title}
                    onChange={(e) => setAgencySettings({ ...agencySettings, meta_title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_meta_description">Meta Description</Label>
                  <Textarea
                    id="edit_meta_description"
                    value={agencySettings.meta_description}
                    onChange={(e) => setAgencySettings({ ...agencySettings, meta_description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_favicon_url">Favicon URL</Label>
                  <Input
                    id="edit_favicon_url"
                    value={agencySettings.favicon_url}
                    onChange={(e) => setAgencySettings({ ...agencySettings, favicon_url: e.target.value })}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateSubdomain}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* TABLE */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agency / URL Slug</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Agency Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subdomains.map((subdomain) => (
            <TableRow key={subdomain.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{subdomain.subdomain}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={() => window.open(`${window.location.origin}/${subdomain.subdomain}`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>{subdomain.user_email}</TableCell>
              <TableCell>{subdomain.agency_name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={subdomain.is_active}
                    onCheckedChange={(checked) => toggleSubdomainStatus(subdomain.id, checked)}
                  />
                  <Badge variant={subdomain.is_active ? "default" : "secondary"}>
                    {subdomain.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                {new Date(subdomain.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(subdomain)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteSubdomain(subdomain.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SubdomainManagement;