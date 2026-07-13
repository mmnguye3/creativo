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
import {
  Loader2, Package, User, Mail, Phone, Building, Calendar, DollarSign,
  FileText, Send, CreditCard, Copy, CheckCircle2, ExternalLink, AlertTriangle,
} from "lucide-react";

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
  price_cents: number | null;
  stripe_session_id: string | null;
  payment_status: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  agency_id: string;
  customer_order_items?: OrderItem[];
}

interface AgencyStripeStatus {
  stripeConnected: boolean;
  onboardingComplete: boolean;
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
  const [quotingOrder, setQuotingOrder] = useState<string | null>(null);
  const [quoteInput, setQuoteInput] = useState<string>("");
  const [sendingPaymentLink, setSendingPaymentLink] = useState<string | null>(null);
  const [checkoutUrls, setCheckoutUrls] = useState<Record<string, string>>({});
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [agencyStripe, setAgencyStripe] = useState<AgencyStripeStatus>({ stripeConnected: false, onboardingComplete: false });
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    checkAgencyStripe();
  }, [statusFilter]);

  const checkAgencyStripe = async () => {
    try {
      const { data } = await supabase.functions.invoke('create-connect-account', { body: { action: 'sync' } });
      if (data) {
        setAgencyStripe({
          stripeConnected: !!(data as any).connected,
          onboardingComplete: !!(data as any).onboardingComplete,
        });
      }
    } catch {
      // silent — payment features just won't appear if Stripe isn't set up
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: agencyData, error: agencyError } = await supabase
        .from('agency_settings')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      if (agencyError || !agencyData) { console.error('Error fetching agency:', agencyError); return; }

      let query = supabase
        .from('customer_orders')
        .select(`*, customer_order_items (id, service_name, service_description, price, quantity)`)
        .eq('agency_id', agencyData.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== "all") query = query.eq('status', statusFilter);

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data as unknown as Order[] || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({ title: "Error", description: "Failed to load orders. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(true);
      const { error } = await supabase.from('customer_orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, status: newStatus });
      toast({ title: "Success", description: "Order status updated successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update order status.", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const submitQuote = async (orderId: string) => {
    const dollars = parseFloat(quoteInput);
    if (isNaN(dollars) || dollars < 0.50) {
      toast({ title: "Invalid amount", description: "Please enter a price of at least $0.50.", variant: "destructive" });
      return;
    }
    const priceCents = Math.round(dollars * 100);
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('customer_orders')
        .update({ price_cents: priceCents, status: 'quoted' })
        .eq('id', orderId);
      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, price_cents: priceCents, status: 'quoted' } : o));
      setQuotingOrder(null);
      setQuoteInput("");
      toast({ title: "Quote set", description: `Order quoted at $${dollars.toFixed(2)}. Ready to send payment link.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to set quote.", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const sendPaymentLink = async (order: Order) => {
    if (!order.price_cents) {
      toast({ title: "No price set", description: "Set a quote price before sending a payment link.", variant: "destructive" });
      return;
    }
    setSendingPaymentLink(order.id);
    try {
      const origin = window.location.origin;
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          orderId: order.id,
          priceCents: order.price_cents,
          successUrl: `${origin}/dashboard`,
          cancelUrl: `${origin}/dashboard`,
          sendEmail: true,
        },
      });
      if (error) throw error;
      const result = data as any;
      if (!result.success) throw new Error(result.error ?? 'Unknown error');

      setCheckoutUrls(prev => ({ ...prev, [order.id]: result.checkoutUrl }));
      setOrders(orders.map(o =>
        o.id === order.id
          ? { ...o, stripe_session_id: result.sessionId, status: 'awaiting_payment', payment_status: 'awaiting_payment' }
          : o
      ));
      toast({
        title: "Payment link created!",
        description: result.emailSent
          ? `Checkout link emailed to ${order.customer_email} and shown below.`
          : "Checkout link created. Copy it below to share with the customer.",
      });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message ?? "Could not create payment link.", variant: "destructive" });
    } finally {
      setSendingPaymentLink(null);
    }
  };

  const copyCheckoutUrl = (orderId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(orderId);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast({ title: "Copied!", description: "Payment link copied to clipboard." });
  };

  const sendInvoice = async (orderId: string) => {
    try {
      setSendingInvoice(orderId);
      const { data, error } = await supabase.functions.invoke('send-invoice', { body: { orderId } });
      if (error) throw error;
      if (data.success) {
        toast({ title: "Invoice Sent!", description: `Invoice ${data.invoiceNumber} sent to the customer.` });
      } else throw new Error(data.error);
    } catch (error) {
      toast({ title: "Error", description: "Failed to send invoice.", variant: "destructive" });
    } finally {
      setSendingInvoice(null);
    }
  };

  const updateOrderNotes = async (orderId: string, notes: string) => {
    try {
      setUpdating(true);
      const { error } = await supabase.from('customer_orders').update({ notes }).eq('id', orderId);
      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, notes } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, notes });
      setEditingNotes(null); setNotesValue("");
      toast({ title: "Success", description: "Notes updated successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update notes.", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':       return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'quoted':        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'awaiting_payment': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'paid':          return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':   return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'completed':     return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':     return 'bg-red-100 text-red-800 border-red-200';
      default:              return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (ps: string) => {
    switch (ps) {
      case 'paid':              return 'bg-green-100 text-green-700 border-green-200';
      case 'awaiting_payment':  return 'bg-purple-100 text-purple-700 border-purple-200';
      default:                  return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const formatStatus = (status: string) =>
    status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

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
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Order Management</h2>
        <div className="flex items-center gap-3">
          {/* Stripe connection notice */}
          {!agencyStripe.onboardingComplete && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-900/30 border border-amber-700/40 rounded-lg px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Set up a payment account in Settings → Payments to enable payment links</span>
            </div>
          )}
          <Label htmlFor="status-filter" className="text-white whitespace-nowrap">Filter:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="all" className="text-white">All Orders</SelectItem>
              <SelectItem value="pending" className="text-white">Pending</SelectItem>
              <SelectItem value="quoted" className="text-white">Quoted</SelectItem>
              <SelectItem value="awaiting_payment" className="text-white">Awaiting Payment</SelectItem>
              <SelectItem value="paid" className="text-white">Paid</SelectItem>
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
              {statusFilter === "all" ? "You haven't received any orders yet." : `No ${formatStatus(statusFilter).toLowerCase()} orders found.`}
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
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                      <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{order.customer_email}</div>
                      {order.customer_phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{order.customer_phone}</div>}
                      {order.customer_company && <div className="flex items-center gap-1"><Building className="h-3 w-3" />{order.customer_company}</div>}
                    </div>
                  </div>
                  <div className="text-right space-y-1.5 shrink-0">
                    <Badge className={getStatusColor(order.status)}>{formatStatus(order.status)}</Badge>
                    {order.payment_status !== 'unpaid' && (
                      <div className="flex justify-end">
                        <Badge className={getPaymentStatusColor(order.payment_status)}>
                          {order.payment_status === 'paid' ? <><CheckCircle2 className="w-2.5 h-2.5 mr-1" />Paid</> : 'Awaiting Payment'}
                        </Badge>
                      </div>
                    )}
                    <div className="text-lg font-bold text-orange-500">
                      {order.price_cents ? `$${(order.price_cents / 100).toFixed(2)}` : `$${order.total_amount}`}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />Ordered: {new Date(order.created_at).toLocaleDateString()}</div>
                  <div className="flex items-center gap-1"><DollarSign className="h-3 w-3" /><span>ID:</span><span>{order.id.slice(0, 8)}</span></div>
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
                            {item.service_description && <p className="text-sm text-gray-400">{item.service_description}</p>}
                          </div>
                          <span className="text-white">{item.quantity}x ${item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Paid indicator ── */}
                {order.payment_status === 'paid' && (
                  <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700/40 rounded-lg text-xs text-green-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <div>
                      <p className="font-medium">Payment received</p>
                      <p>Funds will appear in your payment account within 1–2 business days.</p>
                    </div>
                  </div>
                )}

                {/* ── Checkout URL (after link created) ── */}
                {checkoutUrls[order.id] && order.payment_status !== 'paid' && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-gray-400">Payment link (share with customer):</p>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={checkoutUrls[order.id]}
                        className="bg-gray-800 border-gray-600 text-gray-300 text-xs h-8"
                        data-testid={`input-checkout-url-${order.id}`}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 shrink-0"
                        onClick={() => copyCheckoutUrl(order.id, checkoutUrls[order.id])}
                        data-testid={`button-copy-url-${order.id}`}
                      >
                        {copiedUrl === order.id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 shrink-0"
                        onClick={() => window.open(checkoutUrls[order.id], '_blank')}
                        data-testid={`button-open-url-${order.id}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
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
                      <Button size="sm" onClick={() => { setEditingNotes(order.id); setNotesValue(order.notes || ""); }} className="bg-gray-700 hover:bg-gray-600 text-white text-xs">
                        {order.notes ? "Edit" : "Add Notes"}
                      </Button>
                    )}
                  </div>
                  {editingNotes === order.id ? (
                    <div className="space-y-2">
                      <Textarea value={notesValue} onChange={(e) => setNotesValue(e.target.value)} placeholder="Add notes for this order..." className="bg-gray-800 border-gray-600 text-white" rows={3} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateOrderNotes(order.id, notesValue)} disabled={updating} className="bg-green-600 hover:bg-green-700 text-white">Save</Button>
                        <Button size="sm" onClick={() => { setEditingNotes(null); setNotesValue(""); }} className="bg-gray-600 hover:bg-gray-700 text-white">Cancel</Button>
                      </div>
                    </div>
                  ) : order.notes ? (
                    <p className="text-gray-300 bg-gray-800 p-3 rounded">{order.notes}</p>
                  ) : (
                    <p className="text-gray-500 italic">No notes added yet</p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-600 space-y-3">
                  {/* Quote row — only before payment is collected */}
                  {order.payment_status !== 'paid' && agencyStripe.onboardingComplete && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" /> Payment
                      </p>
                      {quotingOrder === order.id ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                            <Input
                              type="number"
                              min="0.50"
                              step="0.01"
                              value={quoteInput}
                              onChange={(e) => setQuoteInput(e.target.value)}
                              placeholder="0.00"
                              className="pl-6 bg-gray-800 border-gray-600 text-white w-32 h-8"
                              data-testid={`input-quote-${order.id}`}
                            />
                          </div>
                          <Button size="sm" onClick={() => submitQuote(order.id)} disabled={updating} className="h-8 bg-orange-500 hover:bg-orange-600 text-white text-xs">
                            {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Set Quote"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setQuotingOrder(null); setQuoteInput(""); }} className="h-8 text-gray-400 text-xs">Cancel</Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setQuotingOrder(order.id); setQuoteInput(order.price_cents ? (order.price_cents / 100).toFixed(2) : ""); }}
                            className="h-8 border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                            data-testid={`button-set-quote-${order.id}`}
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            {order.price_cents ? `Edit Quote ($${(order.price_cents / 100).toFixed(2)})` : "Set Quote"}
                          </Button>
                          {order.price_cents && order.payment_status !== 'awaiting_payment' && (
                            <Button
                              size="sm"
                              onClick={() => sendPaymentLink(order)}
                              disabled={sendingPaymentLink === order.id}
                              className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs"
                              data-testid={`button-send-payment-link-${order.id}`}
                            >
                              {sendingPaymentLink === order.id
                                ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Creating…</>
                                : <><CreditCard className="w-3 h-3 mr-1" />Send Payment Link</>}
                            </Button>
                          )}
                          {order.payment_status === 'awaiting_payment' && !checkoutUrls[order.id] && (
                            <Button
                              size="sm"
                              onClick={() => sendPaymentLink(order)}
                              disabled={sendingPaymentLink === order.id}
                              variant="outline"
                              className="h-8 border-purple-500 text-purple-400 hover:bg-purple-900/30 text-xs"
                              data-testid={`button-resend-payment-link-${order.id}`}
                            >
                              {sendingPaymentLink === order.id
                                ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Creating…</>
                                : <><CreditCard className="w-3 h-3 mr-1" />Resend Link</>}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status + Invoice row */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-4">
                      <Label htmlFor={`status-${order.id}`} className="text-white">Status:</Label>
                      <Select value={order.status} onValueChange={(s) => updateOrderStatus(order.id, s)} disabled={updating}>
                        <SelectTrigger className="w-44 bg-gray-800 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="pending" className="text-white">Pending</SelectItem>
                          <SelectItem value="quoted" className="text-white">Quoted</SelectItem>
                          <SelectItem value="awaiting_payment" className="text-white">Awaiting Payment</SelectItem>
                          <SelectItem value="paid" className="text-white">Paid</SelectItem>
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
                      {sendingInvoice === order.id
                        ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending...</>
                        : <><Send className="h-4 w-4 mr-2" />Send Invoice</>}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
