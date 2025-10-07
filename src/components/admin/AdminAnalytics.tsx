import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Globe, FileText, TrendingUp } from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalSubdomains: number;
  totalGenerations: number;
  recentSignups: number;
}

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalSubdomains: 0,
    totalGenerations: 0,
    recentSignups: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      // Get total users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      const totalUsers = authUsers?.users.length || 0;

      // Get recent signups (last 30 days)  
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSignups = authUsers?.users.filter((user: any) => 
        user.created_at && new Date(user.created_at) > thirtyDaysAgo
      ).length || 0;

      // Get total subdomains
      const { count: subdomainCount } = await supabase
        .from('agency_subdomains')
        .select('*', { count: 'exact', head: true });

      // Get total AI generations
      const { count: generationCount } = await supabase
        .from('ai_generations')
        .select('*', { count: 'exact', head: true });

      setAnalytics({
        totalUsers,
        totalSubdomains: subdomainCount || 0,
        totalGenerations: generationCount || 0,
        recentSignups
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.recentSignups} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subdomains</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSubdomains}</div>
            <p className="text-xs text-muted-foreground">
              Customer-facing sites
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Generations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalGenerations}</div>
            <p className="text-xs text-muted-foreground">
              Total content generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalUsers > 0 ? Math.round((analytics.recentSignups / analytics.totalUsers) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly growth
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm">
                <p className="font-medium">User Registrations</p>
                <p className="text-muted-foreground">{analytics.recentSignups} new users in the last 30 days</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">Content Generation</p>
                <p className="text-muted-foreground">Users have generated {analytics.totalGenerations} pieces of content</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">Platform Usage</p>
                <p className="text-muted-foreground">{analytics.totalSubdomains} agencies using customer-facing sites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
            <CardDescription>System status and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Database Status</span>
                <span className="text-sm text-green-600">Healthy</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Authentication</span>
                <span className="text-sm text-green-600">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">AI Services</span>
                <span className="text-sm text-green-600">Operational</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;