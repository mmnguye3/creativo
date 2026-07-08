import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Download, Search, Users, Mail, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ClientProject {
  id: string;
  service_type: string;
  description: string;
  generated_content: string | null;
  content_type: 'text' | 'image' | 'combo';
  image_url: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  client_email: string | null;
  purchase_order_id: string | null;
}

export const ClientProjects: React.FC = () => {
  const [clientProjects, setClientProjects] = useState<ClientProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchClientProjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_generations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .or('client_email.not.is.null,purchase_order_id.not.is.null')
        .order('created_at', { ascending: false });

      if (error) {
        // 42703 = undefined column: the client_email / purchase_order_id
        // migration has not been applied to this database yet. No rows can
        // have client data, so show the empty state instead of an error.
        if (error.code === '42703') {
          setClientProjects([]);
          setFilteredProjects([]);
          return;
        }
        throw error;
      }

      setClientProjects(data as unknown as ClientProject[] || []);
      setFilteredProjects(data as unknown as ClientProject[] || []);
    } catch (error) {
      console.error('Error fetching client projects:', error);
      toast({
        title: "Error",
        description: "Failed to load client projects.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientProjects();
  }, [user]);

  useEffect(() => {
    const filtered = clientProjects.filter(project => 
      project.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.purchase_order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [searchTerm, clientProjects]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard.`,
    });
  };

  const downloadImage = (imageUrl: string, projectId: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `client-project-${projectId}.png`;
    link.click();
  };

  const getServiceTypeLabel = (serviceType: string) => {
    const labels: { [key: string]: string } = {
      'social-media-ads': 'Social Media Ads',
      'email-designs': 'Email Designs',
      'presentations': 'Presentations',
      'logos-branding': 'Logos & Branding',
      'illustrations': 'Illustrations',
    };
    return labels[serviceType] || serviceType;
  };

  const exportToCSV = () => {
    const headers = ['Project ID', 'Client Email', 'Purchase Order', 'Service Type', 'Description', 'Completion Date'];
    const csvContent = [
      headers.join(','),
      ...filteredProjects.map(project => [
        project.id.slice(0, 8),
        project.client_email || '',
        project.purchase_order_id || '',
        getServiceTypeLabel(project.service_type),
        `"${project.description.replace(/"/g, '""')}"`,
        new Date(project.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'client-projects.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Client Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading client projects...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Client Projects
        </CardTitle>
        <CardDescription>
          Track completed projects with client emails and purchase orders
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Export Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, PO, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={exportToCSV} 
              variant="outline" 
              disabled={filteredProjects.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Projects Count */}
          <div className="text-sm text-muted-foreground">
            {filteredProjects.length} of {clientProjects.length} client projects
          </div>

          {/* Projects Table */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {clientProjects.length === 0 
                ? "No client projects found. Projects with client emails or purchase orders will appear here."
                : "No projects match your search criteria."
              }
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project ID</TableHead>
                    <TableHead>Client Email</TableHead>
                    <TableHead>Purchase Order</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-mono text-xs">
                        {project.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {project.client_email ? (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{project.client_email}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(project.client_email!, 'Email')}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {project.purchase_order_id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{project.purchase_order_id}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(project.purchase_order_id!, 'Purchase Order')}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getServiceTypeLabel(project.service_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm" title={project.description}>
                          {project.description}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(project.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {project.generated_content && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(project.generated_content!, 'Content')}
                              className="h-8 w-8 p-0"
                              title="Copy content"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                          {project.image_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadImage(project.image_url!, project.id)}
                              className="h-8 w-8 p-0"
                              title="Download image"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};