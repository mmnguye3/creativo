import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Settings, FileText, MessageSquare, Sparkles, History, Users, Building2, ShoppingCart, Shield, Megaphone } from 'lucide-react';
import { AIGenerator } from '@/components/AIGenerator';
import { AIAdsGenerator } from '@/components/AIAdsGenerator';
import { GenerationHistory } from '@/components/GenerationHistory';
import { ClientProjects } from '@/components/ClientProjects';
import { OrderManagement } from '@/components/OrderManagement';
import AgencySettingsForm from '@/components/AgencySettingsForm';
import UserManagement from '@/components/admin/UserManagement';
import SubdomainManagement from '@/components/admin/SubdomainManagement';
import AdminAnalytics from '@/components/admin/AdminAnalytics';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface HistoryGeneration {
  id: string;
  generated_content: string | null;
  image_url: string | null;
  metadata?: Record<string, string> | null;
  description?: string;
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('ai-generator');
  const [selectedAdGeneration, setSelectedAdGeneration] = useState<HistoryGeneration | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setCompany(data.company || '');
        setPhone(data.phone || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error loading profile",
        description: "Please refresh the page and try again.",
        variant: "destructive"
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          first_name: firstName,
          last_name: lastName,
          company: company,
          phone: phone
        });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });

      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleViewAdCampaign = (generation: HistoryGeneration) => {
    setSelectedAdGeneration(generation);
    setActiveTab('ai-ads');
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const userInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';
  const agencyName = company || (firstName && lastName ? `${firstName} ${lastName}` : 'Your Agency');

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome back, {firstName || user.email}!</h1>
          <p className="text-gray-300 mt-2">Manage your account and projects from your dashboard.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content with Tabs */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Horizontally scrollable tab list for mobile */}
              <div className="overflow-x-auto -mx-1 px-1">
                <TabsList className={`flex bg-gray-800 border-gray-700 w-max min-w-full`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="ai-generator" className="flex items-center gap-1.5 whitespace-nowrap">
                        <Sparkles className="h-4 w-4" />
                        <span className="hidden sm:inline">AI Generator</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>Create new AI-powered content</p></TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="ai-ads" className="flex items-center gap-1.5 whitespace-nowrap">
                        <Megaphone className="h-4 w-4" />
                        <span className="hidden sm:inline">AI Ads</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>Generate complete ad campaigns with copy and creative</p></TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="history" className="flex items-center gap-1.5 whitespace-nowrap">
                        <History className="h-4 w-4" />
                        <span className="hidden sm:inline">History</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>View all your previously generated content</p></TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="client-projects" className="flex items-center gap-1.5 whitespace-nowrap">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Projects</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>Track completed client projects</p></TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="orders" className="flex items-center gap-1.5 whitespace-nowrap">
                        <ShoppingCart className="h-4 w-4" />
                        <span className="hidden sm:inline">Orders</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>View and manage customer orders</p></TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="agency-settings" className="flex items-center gap-1.5 whitespace-nowrap">
                        <Building2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Agency</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>Configure your white-label agency website</p></TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="profile" className="flex items-center gap-1.5 whitespace-nowrap">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Profile</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>Manage your account information</p></TooltipContent>
                  </Tooltip>

                  {isAdmin && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TabsTrigger value="admin" className="flex items-center gap-1.5 whitespace-nowrap">
                          <Shield className="h-4 w-4" />
                          <span className="hidden sm:inline">Admin</span>
                        </TabsTrigger>
                      </TooltipTrigger>
                      <TooltipContent><p>Admin dashboard</p></TooltipContent>
                    </Tooltip>
                  )}
                </TabsList>
              </div>

              <TabsContent value="ai-generator" className="mt-6 bg-gray-900 rounded-lg p-4">
                <AIGenerator onGenerationComplete={() => {}} />
              </TabsContent>

              <TabsContent value="ai-ads" className="mt-6 bg-gray-900 rounded-lg p-4">
                <AIAdsGenerator
                  agencyName={agencyName}
                  initialGeneration={selectedAdGeneration}
                  onClear={() => setSelectedAdGeneration(null)}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-6 bg-gray-900 rounded-lg p-4">
                <GenerationHistory onViewAdCampaign={handleViewAdCampaign} />
              </TabsContent>

              <TabsContent value="client-projects" className="mt-6 bg-gray-900 rounded-lg p-4">
                <ClientProjects />
              </TabsContent>

              <TabsContent value="orders" className="mt-6 bg-gray-900 rounded-lg p-4">
                <OrderManagement />
              </TabsContent>

              <TabsContent value="agency-settings" className="mt-6 bg-gray-900 rounded-lg p-4">
                <AgencySettingsForm />
              </TabsContent>

              <TabsContent value="profile" className="mt-6 bg-gray-900 rounded-lg p-4">
                <Card className="bg-black border-orange-200/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Update your personal information and preferences.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={updateProfile} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={user.email || ''}
                          disabled
                          className="opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <Button type="submit" disabled={updating}>
                        {updating ? 'Updating...' : 'Update Profile'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {isAdmin && (
                <TabsContent value="admin" className="mt-6 space-y-6">
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Admin Dashboard
                      </CardTitle>
                      <CardDescription>
                        Manage users, subdomains, and view platform analytics
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Tabs defaultValue="analytics" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
                      <TabsTrigger value="analytics">Analytics</TabsTrigger>
                      <TabsTrigger value="users">User Management</TabsTrigger>
                      <TabsTrigger value="subdomains">Subdomains</TabsTrigger>
                    </TabsList>

                    <TabsContent value="analytics" className="mt-4">
                      <AdminAnalytics />
                    </TabsContent>

                    <TabsContent value="users" className="mt-4">
                      <UserManagement />
                    </TabsContent>

                    <TabsContent value="subdomains" className="mt-4">
                      <SubdomainManagement />
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-black border-orange-200/50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg text-white">
                    {firstName && lastName ? `${firstName} ${lastName}` : 'User'}
                  </h3>
                  <p className="text-sm text-gray-400">{user.email}</p>
                  {company && <p className="text-sm text-gray-400">{company}</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black border-orange-200/50">
              <CardHeader>
                <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-white border-gray-600 hover:bg-gray-800" asChild>
                      <a href="/contact">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contact Support
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Get help with technical issues</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-white border-gray-600 hover:bg-gray-800" asChild>
                      <a href="/services">
                        <FileText className="h-4 w-4 mr-2" />
                        Browse Services
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Explore all available services</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-white border-gray-600 hover:bg-gray-800">
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Manage your subscription and preferences</p></TooltipContent>
                </Tooltip>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
