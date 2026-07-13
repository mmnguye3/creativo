import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, AlertTriangle, ExternalLink, Loader2, RefreshCw, CreditCard, Info } from "lucide-react";

interface AgencySettings {
  id?: string;
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
  instagram_url: string;
  facebook_url: string;
  twitter_url: string;
  linkedin_url: string;
}

interface StripeStatus {
  connected: boolean;
  onboardingComplete: boolean;
  stripeAccountId?: string;
  chargesEnabled?: boolean;
  detailsSubmitted?: boolean;
}

const AgencySettingsForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [settings, setSettings] = useState<AgencySettings>({
    agency_name: "",
    logo_url: "",
    primary_color: "#3b82f6",
    secondary_color: "#1e40af",
    contact_email: "",
    contact_phone: "",
    hero_title: "AI-Powered Solutions for Your Business",
    hero_subtitle: "Transform your business with cutting-edge artificial intelligence",
    about_content: "",
    services_enabled: true,
    features_enabled: true,
    testimonials_enabled: true,
    pricing_enabled: false,
    meta_title: "",
    meta_description: "",
    favicon_url: "",
    hide_powered_by: false,
    instagram_url: "",
    facebook_url: "",
    twitter_url: "",
    linkedin_url: "",
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchSubdomain();
      syncStripeStatus();
    }
  }, [user]);

  const fetchSubdomain = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('agency_subdomains')
        .select('subdomain')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) setSubdomain(data.subdomain);
    } catch (error) {
      console.error('Error fetching subdomain:', error);
    }
  };

  const fetchSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agency_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setSettings({
          id: data.id,
          agency_name: data.agency_name || "",
          logo_url: data.logo_url || "",
          primary_color: data.primary_color || "#3b82f6",
          secondary_color: data.secondary_color || "#1e40af",
          contact_email: data.contact_email || "",
          contact_phone: data.contact_phone || "",
          hero_title: data.hero_title || "AI-Powered Solutions for Your Business",
          hero_subtitle: data.hero_subtitle || "Transform your business with cutting-edge artificial intelligence",
          about_content: data.about_content || "",
          services_enabled: data.services_enabled ?? true,
          features_enabled: data.features_enabled ?? true,
          testimonials_enabled: data.testimonials_enabled ?? true,
          pricing_enabled: data.pricing_enabled ?? false,
          meta_title: data.meta_title || "",
          meta_description: data.meta_description || "",
          favicon_url: data.favicon_url || "",
          hide_powered_by: data.hide_powered_by ?? false,
          instagram_url: (data as any).instagram_url || "",
          facebook_url: (data as any).facebook_url || "",
          twitter_url: (data as any).twitter_url || "",
          linkedin_url: (data as any).linkedin_url || "",
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({ title: "Error", description: "Failed to load agency settings.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const syncStripeStatus = async () => {
    if (!user) return;
    setStripeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: { action: 'sync' },
      });
      if (error) throw error;
      setStripeStatus(data as StripeStatus);
    } catch (err) {
      console.error('Stripe sync error:', err);
    } finally {
      setStripeLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!user) return;
    setConnectingStripe(true);
    try {
      const returnUrl = `${window.location.origin}/dashboard?tab=settings&stripeReturn=1`;
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: { action: 'onboard', returnUrl },
      });
      if (error) throw error;
      const result = data as any;
      if (result.onboardingComplete) {
        setStripeStatus({ connected: true, onboardingComplete: true, stripeAccountId: result.stripeAccountId });
        toast({ title: "Payment Account Connected", description: "Your account is ready to receive payments." });
        return;
      }
      if (result.accountLinkUrl) {
        window.location.href = result.accountLinkUrl;
      } else {
        throw new Error("No onboarding URL returned");
      }
    } catch (err: any) {
      toast({ title: "Connection failed", description: err.message ?? "Failed to connect payment account.", variant: "destructive" });
    } finally {
      setConnectingStripe(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const settingsData = {
        user_id: user.id,
        agency_name: settings.agency_name,
        logo_url: settings.logo_url,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        hero_title: settings.hero_title,
        hero_subtitle: settings.hero_subtitle,
        about_content: settings.about_content,
        services_enabled: settings.services_enabled,
        features_enabled: settings.features_enabled,
        testimonials_enabled: settings.testimonials_enabled,
        pricing_enabled: settings.pricing_enabled,
        meta_title: settings.meta_title,
        meta_description: settings.meta_description,
        favicon_url: settings.favicon_url,
        hide_powered_by: settings.hide_powered_by,
        instagram_url: settings.instagram_url || null,
        facebook_url: settings.facebook_url || null,
        twitter_url: settings.twitter_url || null,
        linkedin_url: settings.linkedin_url || null,
      };
      const { data, error } = await supabase
        .from('agency_settings')
        .upsert(settingsData, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      setSettings(prev => ({ ...prev, id: data.id }));
      toast({ title: "Success", description: "Agency settings saved successfully." });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: "Error", description: "Failed to save agency settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof AgencySettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const MAX_UPLOAD_SIZE = 2 * 1024 * 1024;
  const FAVICON_TYPES = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml', 'image/jpeg', 'image/webp'];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'favicon_url') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const input = e.target;
    const isIcoFile = /\.ico$/i.test(file.name);
    if (!file.type.startsWith('image/') && !isIcoFile) {
      toast({ title: "Invalid file type", description: "Please select an image file (PNG, JPG, SVG, WebP, or ICO).", variant: "destructive" });
      input.value = ""; return;
    }
    if (field === 'favicon_url' && !isIcoFile && !FAVICON_TYPES.includes(file.type)) {
      toast({ title: "Invalid favicon format", description: "Favicons must be ICO, PNG, SVG, JPG, or WebP files.", variant: "destructive" });
      input.value = ""; return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      toast({ title: "File too large", description: `The file is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed size is 2MB.`, variant: "destructive" });
      input.value = ""; return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${field}_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('agency-assets').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('agency-assets').getPublicUrl(fileName);
      handleInputChange(field, publicUrl);
      toast({ title: "Upload successful", description: "File uploaded and URL updated." });
    } catch (error) {
      console.error('Upload error:', error);
      const message = error instanceof Error ? error.message : "Failed to upload file. Please try again.";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  const copySubdomainUrl = () => {
    if (subdomain) {
      const url = `${window.location.protocol}//${window.location.host}?subdomain=${subdomain}`;
      navigator.clipboard.writeText(url);
      toast({ title: "Copied!", description: "Subdomain URL copied to clipboard." });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agency Settings</h2>
          <p className="text-muted-foreground">Customize your white-label agency website</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {subdomain && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Your Agency Website</h3>
                <p className="text-sm text-muted-foreground">Share this link with your clients</p>
                <code className="text-sm bg-muted px-2 py-1 rounded mt-2 inline-block">
                  {window.location.protocol}//{window.location.host}?subdomain={subdomain}
                </code>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copySubdomainUrl}>Copy Link</Button>
                <Button variant="outline" size="sm" onClick={() => window.open(`${window.location.protocol}//${window.location.host}?subdomain=${subdomain}`, '_blank')}>Preview</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">
            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Identity</CardTitle>
              <CardDescription>Configure your agency's visual identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agency_name">Agency Name</Label>
                <Input id="agency_name" value={settings.agency_name} onChange={(e) => handleInputChange("agency_name", e.target.value)} placeholder="Your Agency Name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo</Label>
                <div className="flex gap-2">
                  <Input id="logo_url" value={settings.logo_url} onChange={(e) => handleInputChange("logo_url", e.target.value)} placeholder="https://example.com/logo.png" className="flex-1" />
                  <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo_url')} className="w-32" />
                </div>
                {settings.logo_url && <img src={settings.logo_url} alt="Logo preview" className="h-12 w-auto" />}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <Input id="primary_color" type="color" value={settings.primary_color} onChange={(e) => handleInputChange("primary_color", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <Input id="secondary_color" type="color" value={settings.secondary_color} onChange={(e) => handleInputChange("secondary_color", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input id="contact_email" type="email" value={settings.contact_email} onChange={(e) => handleInputChange("contact_email", e.target.value)} placeholder="contact@youragency.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input id="contact_phone" value={settings.contact_phone} onChange={(e) => handleInputChange("contact_phone", e.target.value)} placeholder="+1 (737) 257-0958" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Add your social links — they appear as icons in the footer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram_url">Instagram URL</Label>
                  <Input id="instagram_url" value={settings.instagram_url} onChange={(e) => handleInputChange("instagram_url", e.target.value)} placeholder="https://instagram.com/youragency" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook_url">Facebook URL</Label>
                  <Input id="facebook_url" value={settings.facebook_url} onChange={(e) => handleInputChange("facebook_url", e.target.value)} placeholder="https://facebook.com/youragency" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter_url">X / Twitter URL</Label>
                  <Input id="twitter_url" value={settings.twitter_url} onChange={(e) => handleInputChange("twitter_url", e.target.value)} placeholder="https://x.com/youragency" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input id="linkedin_url" value={settings.linkedin_url} onChange={(e) => handleInputChange("linkedin_url", e.target.value)} placeholder="https://linkedin.com/company/youragency" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Customize your homepage hero content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero_title">Hero Title</Label>
                <Input id="hero_title" value={settings.hero_title} onChange={(e) => handleInputChange("hero_title", e.target.value)} placeholder="AI-Powered Solutions for Your Business" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                <Textarea id="hero_subtitle" value={settings.hero_subtitle} onChange={(e) => handleInputChange("hero_subtitle", e.target.value)} placeholder="Transform your business with cutting-edge artificial intelligence" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="about_content">About Content</Label>
                <Textarea id="about_content" value={settings.about_content} onChange={(e) => handleInputChange("about_content", e.target.value)} placeholder="Tell visitors about your agency..." rows={4} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Sections</CardTitle>
              <CardDescription>Enable or disable sections on your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: "services_enabled", label: "Services Section", desc: "Display the services section" },
                { id: "features_enabled", label: "Features Section", desc: "Display the features section" },
                { id: "testimonials_enabled", label: "Testimonials Section", desc: "Display the testimonials section" },
                { id: "hide_powered_by", label: 'Hide "Powered By"', desc: "Remove branding attribution" },
              ].map(({ id, label, desc }) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor={id}>{label}</Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch id={id} checked={settings[id as keyof AgencySettings] as boolean} onCheckedChange={(checked) => handleInputChange(id as keyof AgencySettings, checked)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Optimize your website for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input id="meta_title" value={settings.meta_title} onChange={(e) => handleInputChange("meta_title", e.target.value)} placeholder="Your Agency - AI Solutions" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea id="meta_description" value={settings.meta_description} onChange={(e) => handleInputChange("meta_description", e.target.value)} placeholder="Brief description of your agency and services for search engines" rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="favicon_url">Favicon URL</Label>
                <Input id="favicon_url" value={settings.favicon_url} onChange={(e) => handleInputChange("favicon_url", e.target.value)} placeholder="https://example.com/favicon.ico" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PAYMENTS TAB ─────────────────────────────────────────────────────── */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-500" />
                Payment Account
              </CardTitle>
              <CardDescription>
                Connect a payment account to receive payments from your clients directly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Status indicator */}
              {stripeLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking status…
                </div>
              ) : stripeStatus?.onboardingComplete ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg" data-testid="stripe-status-connected">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Connected</p>
                    <p className="text-xs text-green-600">Your account is ready to receive payments.</p>
                  </div>
                  <Badge className="ml-auto bg-green-100 text-green-700 border-green-200">Active</Badge>
                </div>
              ) : stripeStatus?.connected && !stripeStatus.onboardingComplete ? (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg" data-testid="stripe-status-incomplete">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Setup Incomplete</p>
                    <p className="text-xs text-amber-600">Finish setting up your payment account to start receiving payments.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-lg" data-testid="stripe-status-not-connected">
                  <Info className="w-5 h-5 text-stone-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-stone-700">Not Connected</p>
                    <p className="text-xs text-stone-500">Connect a payment account to enable payment links for your orders.</p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {!stripeStatus?.onboardingComplete && (
                  <Button
                    onClick={handleConnectStripe}
                    disabled={connectingStripe}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    data-testid="button-connect-stripe"
                  >
                    {connectingStripe ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" />Connecting…</>
                    ) : stripeStatus?.connected ? (
                      <><ExternalLink className="w-4 h-4 mr-2" />Complete Setup</>
                    ) : (
                      <><CreditCard className="w-4 h-4 mr-2" />Set Up Payments</>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={syncStripeStatus}
                  disabled={stripeLoading}
                  data-testid="button-refresh-stripe-status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${stripeLoading ? 'animate-spin' : ''}`} />
                  Refresh Status
                </Button>
                {stripeStatus?.onboardingComplete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://dashboard.stripe.com/', '_blank')}
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Payment Dashboard
                  </Button>
                )}
              </div>

              {/* Test mode notice */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700 space-y-1">
                    <p className="font-medium">Test Mode Active</p>
                    <p>Payments are currently in sandbox mode — no real money is moved. Use test card <code className="bg-blue-100 px-1 rounded">4242 4242 4242 4242</code> (any future expiry, any CVC) to simulate a successful payment.</p>
                    <p>Contact your platform administrator to enable live payments.</p>
                  </div>
                </div>
              </div>

              {/* How it works */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">How payments work</p>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>You receive an order from a customer on your agency site.</li>
                  <li>Enter a price and set the order to <strong>Quoted</strong>.</li>
                  <li>Click <strong>Send Payment Link</strong> to generate a secure payment link and email it to the customer.</li>
                  <li>Customer pays securely online. Funds transfer to your payment account automatically.</li>
                  <li>Order status automatically updates to <strong>Paid</strong> — you get an email notification.</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgencySettingsForm;
