
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Billing from "./pages/Billing";
import BillingCart from "./pages/BillingCart";
import Patients from "./pages/Patients";
import Prescriptions from "./pages/Prescriptions";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Purchases from "./pages/Purchases";
import BusinessOptimization from "./pages/BusinessOptimization";
import Admin from "./pages/Admin";
import SystemSettings from "./pages/admin/SystemSettings";
import Documentation from "./pages/Documentation";
import SystemTest from "./pages/SystemTest";
import DeletionHistory from "./pages/DeletionHistory";
import NotFound from "./pages/NotFound";

// Legal pages
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import RefundPolicy from "./pages/legal/RefundPolicy";
import AcceptableUsePolicy from "./pages/legal/AcceptableUsePolicy";
import Disclaimers from "./pages/legal/Disclaimers";
import EULA from "./pages/legal/EULA";
import SLA from "./pages/legal/SLA";

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/billing-cart" element={<BillingCart />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/prescriptions" element={<Prescriptions />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/business-optimization" element={<BusinessOptimization />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/system-settings" element={<SystemSettings />} />
        <Route path="/documentation" element={<Documentation />} />
        <Route path="/system-test" element={<SystemTest />} />
        <Route path="/deletion-history" element={<DeletionHistory />} />
        
        {/* Legal Routes */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/acceptable-use-policy" element={<AcceptableUsePolicy />} />
        <Route path="/disclaimers" element={<Disclaimers />} />
        <Route path="/eula" element={<EULA />} />
        <Route path="/sla" element={<SLA />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
