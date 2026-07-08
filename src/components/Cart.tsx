import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingBag, Send, Clock } from "lucide-react";
import { useState } from "react";
import { OrderForm } from "./OrderForm";

const Cart = () => {
  const { cart, updateQuantity, removeItem } = useCart();
  const [showOrderForm, setShowOrderForm] = useState(false);

  if (cart.items.length === 0) {
    return (
      <Card className="bg-white border shadow-lg">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-black">Your Cart is Empty</h3>
          <p className="text-gray-600 text-center text-sm">
            Browse our services below and add items to get started with your project.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (showOrderForm) {
    return <OrderForm onBack={() => setShowOrderForm(false)} />;
  }

  return (
    <Card className="bg-white border shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Your Project Cart
          <Badge variant="secondary" className="bg-white text-orange-600">
            {cart.items.length} item{cart.items.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <p className="text-sm opacity-90">Ready to start your project?</p>
      </CardHeader>
      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div className="flex-1">
              <h4 className="font-semibold text-black">{item.name}</h4>
              <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-bold text-orange-600">${item.price}</span>
                <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                  <Clock className="w-3 h-3 mr-1" />
                  Fast delivery
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2 bg-white rounded-lg border p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="h-8 w-8 p-0 text-gray-700 hover:text-black hover:bg-gray-100"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-8 text-center font-medium text-black">{item.quantity}</span>
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="h-8 w-8 p-0 text-gray-700 hover:text-black hover:bg-gray-100"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        
        <div className="border-t pt-4 bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-black">Project Total:</span>
            <span className="text-2xl font-bold text-orange-600">${cart.total}</span>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Estimated delivery: 2-5 business days</span>
            </div>
            <p className="text-xs text-gray-500">
              ✨ Payment due before project start • We'll contact you about payment • 100% satisfaction guarantee
            </p>
          </div>
          
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold py-3 shadow-lg"
            onClick={() => setShowOrderForm(true)}
          >
            <Send className="w-5 h-5 mr-2" />
            Send Project Request
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Cart;