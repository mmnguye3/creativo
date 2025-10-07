import { useState } from "react";
import { useWhiteLabel } from "@/contexts/WhiteLabelContext";

import WhiteLabelNavbar from "@/components/WhiteLabelNavbar";
import WhiteLabelFooter from "@/components/WhiteLabelFooter";
import SalesFunnelHero from "@/components/SalesFunnelHero";
import ServiceShowcase from "@/components/ServiceShowcase";
import Cart from "@/components/Cart";

const WhiteLabelSite = () => {
  const { agencySettings, loading, error } = useWhiteLabel();
  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Site Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!agencySettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Site Not Available</h1>
          <p className="text-muted-foreground">This agency site is not configured yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
        <WhiteLabelNavbar />
        
        {/* Sales Funnel Layout */}
        <div className="relative">
          {/* Step 1: Hero - Grab Attention */}
          <SalesFunnelHero />
          
          {/* Step 2: Services - Show Solutions */}
          <ServiceShowcase />
          
        </div>
        
        <WhiteLabelFooter />
      </div>
    );
};

export default WhiteLabelSite;