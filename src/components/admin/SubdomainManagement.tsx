import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
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

const SubdomainManagement = () => {
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSubdomain, setNewSubdomain] = useState({ subdomain: '', user_id: '', agency_name: '' });

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

  const createSubdomain = async () => {
    try {
      // Create subdomain
      const { data, error } = await supabase
        .from('agency_subdomains')
        .insert({
          subdomain: newSubdomain.subdomain,
          user_id: newSubdomain.user_id
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create or update agency settings if agency name is provided
      if (newSubdomain.agency_name) {
        await supabase
          .from('agency_settings')
          .upsert({
            user_id: newSubdomain.user_id,
            agency_name: newSubdomain.agency_name
          });
      }

      toast({
        title: "Success",
        description: "Subdomain created successfully",
      });

      setCreateDialogOpen(false);
      setNewSubdomain({ subdomain: '', user_id: '', agency_name: '' });
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
        <h3 className="text-lg font-semibold">Subdomains ({subdomains.length})</h3>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Subdomain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Subdomain</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subdomain">Subdomain</Label>
                <Input
                  id="subdomain"
                  value={newSubdomain.subdomain}
                  onChange={(e) => setNewSubdomain({ ...newSubdomain, subdomain: e.target.value })}
                  placeholder="myagency"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Will be accessible at: {newSubdomain.subdomain}.yourdomain.com
                </p>
              </div>
              <div>
                <Label htmlFor="user">Assign to User</Label>
                <Select value={newSubdomain.user_id} onValueChange={(value) => setNewSubdomain({ ...newSubdomain, user_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="agency_name">Agency Name (Optional)</Label>
                <Input
                  id="agency_name"
                  value={newSubdomain.agency_name}
                  onChange={(e) => setNewSubdomain({ ...newSubdomain, agency_name: e.target.value })}
                  placeholder="Agency Name"
                />
              </div>
              <Button onClick={createSubdomain} className="w-full">
                Create Subdomain
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subdomain</TableHead>
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
                    onClick={() => window.open(`${window.location.protocol}//${window.location.host}?subdomain=${subdomain.subdomain}`, '_blank')}
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
                  <Button variant="outline" size="sm">
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