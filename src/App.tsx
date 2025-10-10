import { Routes, Route } from 'react-router-dom';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Services from "@/pages/ServicesPage";
import Features from "@/pages/FeaturesPage";
import Pricing from "@/pages/PricingPage";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Resources from "@/pages/Resources";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";
import WhiteLabelSite from "@/pages/WhiteLabelSite";
import CartPage from "@/pages/CartPage";
import ThankYou from "@/pages/ThankYou";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { WhiteLabelProvider, useWhiteLabel } from "@/contexts/WhiteLabelContext";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <Routes>
      {/* Auth and Admin Routes */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      
      {/* Main Site Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="features" element={<Features />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="resources" element={<Resources />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="terms-of-service" element={<TermsOfService />} />
      </Route>

      {/* White-Label Agency Routes (Path-Based) */}
      <Route path="/:agencySlug" element={
        <CartProvider>
          <WhiteLabelSite />
        </CartProvider>
      } />
      <Route path="/:agencySlug/cart" element={
        <CartProvider>
          <CartPage />
        </CartProvider>
      } />
      <Route path="/:agencySlug/thank-you" element={
        <CartProvider>
          <ThankYou />
        </CartProvider>
      } />
      <Route path="/:agencySlug/privacy-policy" element={
        <CartProvider>
          <PrivacyPolicy />
        </CartProvider>
      } />
      <Route path="/:agencySlug/terms-of-service" element={
        <CartProvider>
          <TermsOfService />
        </CartProvider>
      } />

      {/* 404 - Must be last */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WhiteLabelProvider>
          <TooltipProvider>
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </WhiteLabelProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;