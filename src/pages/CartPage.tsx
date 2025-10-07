import { useWhiteLabel } from "@/contexts/WhiteLabelContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import WhiteLabelNavbar from "@/components/WhiteLabelNavbar";
import WhiteLabelFooter from "@/components/WhiteLabelFooter";
import Cart from "@/components/Cart";

const CartPage = () => {
  const { agencySettings } = useWhiteLabel();
  const navigate = useNavigate();

  if (!agencySettings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <WhiteLabelNavbar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={20} />
                Back to Services
              </Button>
            </div>
            <h1 className="text-3xl font-bold mb-8 text-center">Your Cart</h1>
            <Cart />
          </div>
        </main>
      <WhiteLabelFooter />
    </div>
  );
};

export default CartPage;