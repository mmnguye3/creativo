import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, User, Mail, Phone, Building, Calendar, DollarSign, FileText, Send } from "lucide-react";

interface OrderItem {
  id: string;
  service_name: string;
  service_description: string | null;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_company: string | null;
  total_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  agency_id: string;
  customer_order_items?: OrderItem[];
}

export const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Get the user's agency settings first
      const { data: agencyData, error: agencyError } = await supabase
        .from('agency_settings')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (agencyError || !agencyData) {
        console.error('Error fetching agency:', agencyError);
        return;
      }

      // Build the query
      let query = supabase
        .from('customer_orders')
        .select(`
          *,
          customer_order_items (
            id,
            service_name,
            service_description,
            price,
            quantity
          )
        `)
        .eq('agency_id', agencyData.id)
        .order('created_at', { ascending: false });

      // Add status filter if not "all"
      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOrders(data as unknown as Order[] || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(true);
      
      const { error } = await supabase
        .from('customer_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      toast({
        title: "Success",
        description: "Order status updated successfully."
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const sendInvoice = async (orderId: string) => {
    try {
      setSendingInvoice(orderId);
      
      const { data, error } = await supabase.functions.invoke('send-invoice', {
        body: { orderId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Invoice Sent!",
          description: `Invoice ${data.invoiceNumber} has been sent to the customer successfully.`
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast({
        title: "Error",
        description: "Failed to send invoice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSendingInvoice(null);
    }
  };

  const updateOrderNotes = async (orderId: string, notes: string) => {
    try {
      setUpdating(true);
      
      const { error } = await supabase
        .from('customer_orders')
        .update({ notes })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, notes }
          : order
      ));

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, notes });
      }

      setEditingNotes(null);
      setNotesValue("");

      toast({
        title: "Success",
        description: "Notes updated successfully."
      });
    } catch (error) {
      console.error('Error updating notes:', error);
      toast({
        title: "Error",
        description: "Failed to update notes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const startEditingNotes = (orderId: string, currentNotes: string) => {
    setEditingNotes(orderId);
    setNotesValue(currentNotes || "");
  };

  const cancelEditingNotes = () => {
    setEditingNotes(null);
    setNotesValue("");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-2 text-white">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Order Management</h2>
        <div className="flex items-center gap-4">
          <Label htmlFor="status-filter" className="text-white">Filter by status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="all" className="text-white">All Orders</SelectItem>
              <SelectItem value="pending" className="text-white">Pending</SelectItem>
              <SelectItem value="in_progress" className="text-white">In Progress</SelectItem>
              <SelectItem value="completed" className="text-white">Completed</SelectItem>
              <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="bg-black border-orange-200/50">
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Orders Found</h3>
            <p className="text-gray-400">
              {statusFilter === "all" 
                ? "You haven't received any orders yet." 
                : `No ${formatStatus(statusFilter).toLowerCase()} orders found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="bg-black border-orange-200/50">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-white flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {order.customer_name}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {order.customer_email}
                      </div>
                      {order.customer_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {order.customer_phone}
                        </div>
                      )}
                      {order.customer_company && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {order.customer_company}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Badge className={getStatusColor(order.status)}>
                      {formatStatus(order.status)}
                    </Badge>
                    <div className="text-lg font-bold text-orange-500">
                      ${order.total_amount}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Ordered: {new Date(order.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>Order ID:</span>
                    <span>{order.id.slice(0, 8)}</span>
                  </div>
                </div>

                {/* Order Items */}
                {order.customer_order_items && order.customer_order_items.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-white">Order Items:</h4>
                    <div className="space-y-1">
                      {order.customer_order_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                          <div>
                            <span className="text-white font-medium">{item.service_name}</span>
                            {item.service_description && (
                              <p className="text-sm text-gray-400">{item.service_description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-white">{item.quantity}x ${item.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <h4 className="font-semibold text-white">Notes:</h4>
                    </div>
                    {editingNotes !== order.id && (
                      <Button
                        size="sm"
                        onClick={() => startEditingNotes(order.id, order.notes || "")}
                        className="bg-gray-700 hover:bg-gray-600 text-white text-xs"
                      >
                        {order.notes ? "Edit" : "Add Notes"}
                      </Button>
                    )}
                  </div>
                  {editingNotes === order.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        placeholder="Add notes for this order..."
                        className="bg-gray-800 border-gray-600 text-white"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateOrderNotes(order.id, notesValue)}
                          disabled={updating}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          onClick={cancelEditingNotes}
                          className="bg-gray-600 hover:bg-gray-700 text-white"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : order.notes ? (
                    <p className="text-gray-300 bg-gray-800 p-3 rounded">{order.notes}</p>
                  ) : (
                    <p className="text-gray-500 italic">No notes added yet</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-600">
                  <div className="flex items-center gap-4">
                    <Label htmlFor={`status-${order.id}`} className="text-white">Status:</Label>
                    <Select
                      value={order.status}
                      onValueChange={(newStatus) => updateOrderStatus(order.id, newStatus)}
                      disabled={updating}
                    >
                      <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="pending" className="text-white">Pending</SelectItem>
                        <SelectItem value="in_progress" className="text-white">In Progress</SelectItem>
                        <SelectItem value="completed" className="text-white">Completed</SelectItem>
                        <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    {updating && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
                  </div>
                  
                  <Button
                    onClick={() => sendInvoice(order.id)}
                    disabled={sendingInvoice === order.id}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {sendingInvoice === order.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Invoice
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};