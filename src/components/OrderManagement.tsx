import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Package, User, Mail, Phone, Building, Calendar, DollarSign,
  FileText, Send, CreditCard, Copy, CheckCircle2, ExternalLink, AlertTriangle, ShoppingBag,
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

const STATUS_CHIP: Record<string, string> = {
  pending:          'bg-[#eef2f7] text-[#697386]',
  quoted:           'bg-[#e1effe] text-[#1c64f2]',
  awaiting_payment: 'bg-[#f5f3ff] text-[#7c3aed]',
  paid:             'bg-[#e1effe] text-[#1c64f2]',
  in_progress:      'bg-[#fff4ed] text-[#ea580c]',
  completed:        'bg-[#def7ec] text-[#0e9f6e]',
  cancelled:        'bg-[#fee2e2] text-[#ef4444]',
};

const PAYMENT_CHIP: Record<string, string> = {
  paid:             'bg-[#def7ec] text-[#0e9f6e]',
  awaiting_payment: 'bg-[#f5f3ff] text-[#7c3aed]',
};

function formatStatus(status: string) {
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#e6e9ee] shadow-[0_1px_3px_rgba(10,37,64,.06)] p-5 space-y-4">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-[#e6e9ee] rounded animate-pulse" />
          <div className="h-3 w-48 bg-[#e6e9ee] rounded animate-pulse" />
        </div>
        <div className="h-6 w-20 bg-[#e6e9ee] rounded-full animate-pulse" />
      </div>
      <div className="h-px bg-[#e6e9ee]" />
      <div className="flex gap-3">
        <div className="h-8 flex-1 bg-[#e6e9ee] rounded-lg animate-pulse" />
        <div className="h-8 w-28 bg-[#e6e9ee] rounded-lg animate-pulse" />
      </div>
    </div>
  );
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
      // silent
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;
      let query = supabase
        .from('customer_orders')
        .select(`*, customer_order_items (id, service_name, service_description, price, quantity)`)
        .eq('agency_id', userId)
        .order('created_at', { ascending: false });
      if (statusFilter !== "all") query = query.eq('status', statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      setOrders(data as unknown as Order[] || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({ title: "Error", description: "Failed to load orders.", variant: "destructive" });
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
      toast({ title: "Success", description: "Order status updated." });
    } catch {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const submitQuote = async (orderId: string) => {
    const dollars = parseFloat(quoteInput);
    if (isNaN(dollars) || dollars < 0.50) {
      toast({ title: "Invalid amount", description: "Enter at least $0.50.", variant: "destructive" });
      return;
    }
    const priceCents = Math.round(dollars * 100);
    try {
      setUpdating(true);
      const { error } = await supabase.from('customer_orders').update({ price_cents: priceCents, status: 'quoted' }).eq('id', orderId);
      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, price_cents: priceCents, status: 'quoted' } : o));
      setQuotingOrder(null); setQuoteInput("");
      toast({ title: "Quote set", description: `Quoted at $${dollars.toFixed(2)}.` });
    } catch {
      toast({ title: "Error", description: "Failed to set quote.", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const sendPaymentLink = async (order: Order) => {
    if (!order.price_cents) {
      toast({ title: "No price set", description: "Set a quote first.", variant: "destructive" });
      return;
    }
    setSendingPaymentLink(order.id);
    try {
      const origin = window.location.origin;
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { orderId: order.id, priceCents: order.price_cents, successUrl: `${origin}/dashboard`, cancelUrl: `${origin}/dashboard`, sendEmail: true },
      });
      if (error) throw error;
      const result = data as any;
      if (!result.success) throw new Error(result.error ?? 'Unknown error');
      setCheckoutUrls(prev => ({ ...prev, [order.id]: result.checkoutUrl }));
      setOrders(orders.map(o => o.id === order.id ? { ...o, stripe_session_id: result.sessionId, status: 'awaiting_payment', payment_status: 'awaiting_payment' } : o));
      toast({ title: "Payment link created!", description: result.emailSent ? `Link emailed to ${order.customer_email}.` : "Copy the link below to share." });
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
    toast({ title: "Copied!", description: "Payment link copied." });
  };

  const sendInvoice = async (orderId: string) => {
    try {
      setSendingInvoice(orderId);
      const { data, error } = await supabase.functions.invoke('send-invoice', { body: { orderId } });
      if (error) throw error;
      if (data.success) {
        toast({ title: "Invoice Sent!", description: `Invoice ${data.invoiceNumber} sent to customer.` });
      } else throw new Error(data.error);
    } catch {
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
      toast({ title: "Success", description: "Notes updated." });
    } catch {
      toast({ title: "Error", description: "Failed to update notes.", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <div className="h-7 w-44 bg-[#e6e9ee] rounded animate-pulse" />
          <div className="h-8 w-36 bg-[#e6e9ee] rounded-xl animate-pulse" />
        </div>
        {[...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-[#0a2540]">Order Management</h2>
        <div className="flex items-center gap-3">
          {!agencyStripe.onboardingComplete && (
            <div className="flex items-center gap-1.5 text-xs text-[#ea580c] bg-[#fff4ed] border border-orange-200 rounded-xl px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Set up Payments in Settings to enable payment links</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Label htmlFor="status-filter" className="text-xs text-[#697386] whitespace-nowrap font-medium">Filter:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 h-8 text-xs bg-white border-[#e6e9ee] text-[#425466] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e6e9ee] shadow-[0_1px_3px_rgba(10,37,64,.06)]">
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-orange-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#0a2540]">No Orders Found</p>
              <p className="text-xs text-[#697386] mt-1 max-w-xs">
                {statusFilter === "all"
                  ? "You haven't received any orders yet. Share your agency site to start getting orders."
                  : `No ${formatStatus(statusFilter).toLowerCase()} orders found.`}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-[#e6e9ee] shadow-[0_1px_3px_rgba(10,37,64,.06)] hover:shadow-[0_4px_16px_rgba(10,37,64,.08)] transition-shadow">
              {/* Card header */}
              <div className="px-5 py-4 border-b border-[#e6e9ee]">
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-orange-500" />
                      </div>
                      <p className="font-semibold text-[#0a2540]">{order.customer_name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#697386]">
                      <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{order.customer_email}</div>
                      {order.customer_phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{order.customer_phone}</div>}
                      {order.customer_company && <div className="flex items-center gap-1"><Building className="h-3 w-3" />{order.customer_company}</div>}
                    </div>
                  </div>
                  <div className="text-right space-y-1.5 shrink-0">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_CHIP[order.status] || 'bg-[#eef2f7] text-[#697386]'}`}>
                      {formatStatus(order.status)}
                    </span>
                    {order.payment_status !== 'unpaid' && order.payment_status in PAYMENT_CHIP && (
                      <div className="flex justify-end">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${PAYMENT_CHIP[order.payment_status]}`}>
                          {order.payment_status === 'paid' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {order.payment_status === 'paid' ? 'Paid' : 'Awaiting Payment'}
                        </span>
                      </div>
                    )}
                    <div className="text-base font-bold text-orange-500">
                      {order.price_cents ? `$${(order.price_cents / 100).toFixed(2)}` : `$${order.total_amount}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="px-5 py-4 space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#697386]">
                  <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />Ordered: {new Date(order.created_at).toLocaleDateString()}</div>
                  <div className="flex items-center gap-1"><Package className="h-3 w-3" /><span>ID: {order.id.slice(0, 8)}</span></div>
                </div>

                {/* Order items */}
                {order.customer_order_items && order.customer_order_items.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-[#0a2540]">Order Items</h4>
                    <div className="space-y-1">
                      {order.customer_order_items.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-[#f6f9fc] border border-[#e6e9ee] px-3 py-2 rounded-xl">
                          <div>
                            <span className="text-xs font-medium text-[#0a2540]">{item.service_name}</span>
                            {item.service_description && <p className="text-[10px] text-[#697386]">{item.service_description}</p>}
                          </div>
                          <span className="text-xs font-semibold text-[#0a2540]">{item.quantity}× ${item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paid notice */}
                {order.payment_status === 'paid' && (
                  <div className="flex items-center gap-2 p-3 bg-[#def7ec]/50 border border-[#def7ec] rounded-xl text-xs text-[#0e9f6e]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <div>
                      <p className="font-semibold">Payment received</p>
                      <p className="opacity-80">Funds will appear in your payment account within 1–2 business days.</p>
                    </div>
                  </div>
                )}

                {/* Checkout URL */}
                {checkoutUrls[order.id] && order.payment_status !== 'paid' && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-[#697386]">Payment link — share with customer:</p>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={checkoutUrls[order.id]}
                        className="bg-[#f6f9fc] border-[#e6e9ee] text-[#425466] text-xs h-8 rounded-xl"
                        data-testid={`input-checkout-url-${order.id}`}
                      />
                      <Button size="sm" variant="outline" className="h-8 shrink-0 border-[#e6e9ee]" onClick={() => copyCheckoutUrl(order.id, checkoutUrls[order.id])} data-testid={`button-copy-url-${order.id}`}>
                        {copiedUrl === order.id ? <CheckCircle2 className="w-3.5 h-3.5 text-[#0e9f6e]" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 shrink-0 border-[#e6e9ee]" onClick={() => window.open(checkoutUrls[order.id], '_blank')} data-testid={`button-open-url-${order.id}`}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-[#697386]" />
                      <h4 className="text-xs font-semibold text-[#0a2540]">Notes</h4>
                    </div>
                    {editingNotes !== order.id && (
                      <Button size="sm" variant="outline" onClick={() => { setEditingNotes(order.id); setNotesValue(order.notes || ""); }} className="text-xs h-7 border-[#e6e9ee] text-[#425466] hover:bg-[#f6f9fc]">
                        {order.notes ? "Edit" : "Add Notes"}
                      </Button>
                    )}
                  </div>
                  {editingNotes === order.id ? (
                    <div className="space-y-2">
                      <Textarea value={notesValue} onChange={e => setNotesValue(e.target.value)} placeholder="Add notes for this order…" className="bg-[#f6f9fc] border-[#e6e9ee] text-[#425466] text-xs rounded-xl" rows={3} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateOrderNotes(order.id, notesValue)} disabled={updating} className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-7">Save</Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingNotes(null); setNotesValue(""); }} className="text-xs h-7 border-[#e6e9ee] text-[#697386]">Cancel</Button>
                      </div>
                    </div>
                  ) : order.notes ? (
                    <p className="text-xs text-[#425466] bg-[#f6f9fc] border border-[#e6e9ee] p-3 rounded-xl">{order.notes}</p>
                  ) : (
                    <p className="text-xs text-[#697386] italic">No notes added yet</p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-[#e6e9ee] space-y-3">
                  {/* Payment row */}
                  {order.payment_status !== 'paid' && agencyStripe.onboardingComplete && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[#697386] flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" /> Payment
                      </p>
                      {quotingOrder === order.id ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#697386] text-xs">$</span>
                            <Input
                              type="number" min="0.50" step="0.01"
                              value={quoteInput} onChange={e => setQuoteInput(e.target.value)} placeholder="0.00"
                              className="pl-6 bg-[#f6f9fc] border-[#e6e9ee] text-[#425466] w-32 h-8 text-xs rounded-xl"
                              data-testid={`input-quote-${order.id}`}
                            />
                          </div>
                          <Button size="sm" onClick={() => submitQuote(order.id)} disabled={updating} className="h-8 bg-orange-500 hover:bg-orange-600 text-white text-xs">
                            {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Set Quote"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setQuotingOrder(null); setQuoteInput(""); }} className="h-8 text-[#697386] text-xs">Cancel</Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button size="sm" variant="outline"
                            onClick={() => { setQuotingOrder(order.id); setQuoteInput(order.price_cents ? (order.price_cents / 100).toFixed(2) : ""); }}
                            className="h-8 border-[#e6e9ee] text-[#425466] hover:bg-[#f6f9fc] text-xs"
                            data-testid={`button-set-quote-${order.id}`}
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            {order.price_cents ? `Edit Quote ($${(order.price_cents / 100).toFixed(2)})` : "Set Quote"}
                          </Button>
                          {order.price_cents && order.payment_status !== 'awaiting_payment' && (
                            <Button size="sm" onClick={() => sendPaymentLink(order)} disabled={sendingPaymentLink === order.id}
                              className="h-8 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs"
                              data-testid={`button-send-payment-link-${order.id}`}
                            >
                              {sendingPaymentLink === order.id
                                ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Creating…</>
                                : <><CreditCard className="w-3 h-3 mr-1" />Send Payment Link</>}
                            </Button>
                          )}
                          {order.payment_status === 'awaiting_payment' && !checkoutUrls[order.id] && (
                            <Button size="sm" onClick={() => sendPaymentLink(order)} disabled={sendingPaymentLink === order.id}
                              variant="outline" className="h-8 border-[#e6e9ee] text-[#7c3aed] hover:bg-[#f5f3ff] text-xs"
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

                  {/* Status + invoice row */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <Label htmlFor={`status-${order.id}`} className="text-xs text-[#697386] font-medium">Status:</Label>
                      <Select value={order.status} onValueChange={s => updateOrderStatus(order.id, s)} disabled={updating}>
                        <SelectTrigger className="w-44 h-8 text-xs bg-[#f6f9fc] border-[#e6e9ee] text-[#425466] rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="quoted">Quoted</SelectItem>
                          <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      {updating && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
                    </div>

                    <Button
                      onClick={() => sendInvoice(order.id)}
                      disabled={sendingInvoice === order.id}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8"
                    >
                      {sendingInvoice === order.id
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Sending…</>
                        : <><Send className="h-3.5 w-3.5 mr-1.5" />Send Invoice</>}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
