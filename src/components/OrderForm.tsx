import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { useWhiteLabel } from "@/contexts/WhiteLabelContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface OrderFormProps {
  onBack: () => void;
}

export const OrderForm = ({ onBack }: OrderFormProps) => {
  const { cart, clearCart } = useCart();
  const { agencySettings, agencySlug } = useWhiteLabel();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Order submission started:', {
      agencyUserId: agencySettings?.user_id,
      formData,
      cartItems: cart.items,
      cartTotal: cart.total
    });

    if (!agencySettings?.user_id) {
      console.error('Agency user ID not found:', agencySettings);
      toast({
        title: "Error",
        description: "Agency not found. Please try again.",
        variant: "destructive"
      });
      return;
    }

    if (cart.items.length === 0) {
      console.error('Cart is empty');
      toast({
        title: "Error",
        description: "Your cart is empty. Please add items before submitting.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name || !formData.email) {
      console.error('Required fields missing:', { name: formData.name, email: formData.email });
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Debug logging
      console.log('=== ORDER SUBMISSION DEBUG ===');
      console.log('Full agencySettings:', agencySettings);
      console.log('agency_id being sent:', agencySettings.user_id);
      console.log('cart total:', cart.total);
      console.log('form data:', formData);
      
      const orderPayload = {
        agency_id: agencySettings.user_id,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone || null,
        customer_company: formData.company || null,
        total_amount: cart.total,
        notes: formData.notes || null
      };
      
      console.log('Order payload:', orderPayload);
      
      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('customer_orders')
        .insert(orderPayload)
        .select('id')
        .single();
      
      console.log('Order result:', { orderData, orderError });

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.items.map(item => ({
        order_id: orderData.id,
        service_name: item.name,
        service_description: item.description,
        price: item.price,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('customer_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      const orderTotal = cart.total;
      clearCart();
      
      // Navigate to thank you page with order total
      navigate(`/${agencySlug}/thank-you`, { 
        state: { orderTotal }
      });
    } catch (error) {
      console.error('Error submitting order:', error);
      console.error('Full error details:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      toast({
        title: "Error",
        description: `Failed to submit order: ${error?.message || 'Unknown error'}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full min-h-screen overflow-y-auto">
      <Card className="bg-white border shadow-lg w-full max-w-none min-h-full">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
          <CardTitle className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            Complete Your Project Request
          </CardTitle>
          <p className="text-sm opacity-90">Just a few details to get started on your project</p>
        </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Project Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Tell us about your project, timeline, specific requirements..."
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
            />
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg">
            <h4 className="font-semibold mb-4 text-black">📋 Project Summary</h4>
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-700">{item.name} (x{item.quantity})</span>
                  <span className="font-medium text-black">${item.price * item.quantity}</span>
                </div>
              ))}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                <span className="text-black">Total Project Value:</span>
                <span className="text-orange-600">${cart.total}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                ⚡ Estimated delivery: 2-5 business days
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 p-4 rounded-lg">
            <p className="text-sm text-green-800 mb-2">
              <strong>Simple 3-Step Process:</strong>
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-2xl mb-1">📝</div>
                <div className="text-xs font-medium text-gray-700">1. You Order</div>
                <div className="text-xs text-gray-500">Submit your request</div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-2xl mb-1">💳</div>
                <div className="text-xs font-medium text-gray-700">2. You Pay</div>
                <div className="text-xs text-gray-500">Secure payment</div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-2xl mb-1">🚚</div>
                <div className="text-xs font-medium text-gray-700">3. We Deliver</div>
                <div className="text-xs text-gray-500">Get your project</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 text-center">
            By submitting, you agree to have {agencySettings?.agency_name} contact you about this project.
          </p>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold py-4 text-lg shadow-lg" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending Your Request..." : `Send Project Request - $${cart.total}`}
          </Button>
        </form>
      </CardContent>
      </Card>
    </div>
  );
};