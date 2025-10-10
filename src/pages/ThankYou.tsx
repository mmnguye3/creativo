import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWhiteLabel } from "@/contexts/WhiteLabelContext";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import WhiteLabelNavbar from "@/components/WhiteLabelNavbar";
import WhiteLabelFooter from "@/components/WhiteLabelFooter";

const ThankYou = () => {
  const { agencySettings, agencySlug, loading } = useWhiteLabel();
  const navigate = useNavigate();
  const location = useLocation();
  const orderTotal = location.state?.orderTotal || 0;

  useEffect(() => {
    // Wait for context to load before redirecting
    if (!loading && agencySlug && !orderTotal) {
      navigate(`/${agencySlug}`);
    }
  }, [orderTotal, navigate, agencySlug, loading]);

  if (loading || !agencySettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <WhiteLabelNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 md:p-12">
          <div className="text-center space-y-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Request Sent Successfully! 🎉
            </h1>
            
            <p className="text-lg text-gray-600">
              Thank you for choosing {agencySettings?.agency_name}! We've received your project request and will contact you within 2 hours to discuss details and payment arrangements for your project.
            </p>
            
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg border border-orange-200">
              <p className="text-base text-gray-700 mb-2">
                <strong>Project Total:</strong>{" "}
                <span className="text-orange-600 font-bold text-2xl">${orderTotal}</span>
              </p>
              <p className="text-sm text-gray-600">
                💳 No payment required now • We'll invoice after project completion
              </p>
            </div>
            
            <div className="pt-6 space-y-3">
              <Button
                onClick={() => navigate(`/${agencySlug}`)}
                size="lg"
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
              >
                Return to Home
              </Button>
              
              <p className="text-sm text-gray-500">
                Check your email for order confirmation and next steps
              </p>
            </div>
          </div>
        </div>
      </main>
      <WhiteLabelFooter />
    </div>
  );
};

export default ThankYou;
