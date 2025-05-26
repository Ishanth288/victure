
import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Documentation from "@/pages/Documentation";
import AcceptableUsePolicy from "@/pages/legal/AcceptableUsePolicy";
import Disclaimers from "@/pages/legal/Disclaimers";
import EULA from "@/pages/legal/EULA";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import RefundPolicy from "@/pages/legal/RefundPolicy";
import SLA from "@/pages/legal/SLA";
import TermsOfService from "@/pages/legal/TermsOfService";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import Settings from "@/pages/Settings";
import Patients from "@/pages/Patients";
import Prescriptions from "@/pages/Prescriptions";
import Billing from "@/pages/Billing";
import BillingCart from "@/pages/BillingCart";
import Purchases from "@/pages/Purchases";
import BusinessOptimization from "@/pages/BusinessOptimization";
import Insights from "@/pages/Insights";
import Admin from "@/pages/Admin";

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/documentation" element={<Documentation />} />
        
        {/* Legal pages */}
        <Route path="/legal/acceptable-use" element={<AcceptableUsePolicy />} />
        <Route path="/legal/disclaimers" element={<Disclaimers />} />
        <Route path="/legal/eula" element={<EULA />} />
        <Route path="/legal/privacy" element={<PrivacyPolicy />} />
        <Route path="/legal/refund" element={<RefundPolicy />} />
        <Route path="/legal/sla" element={<SLA />} />
        <Route path="/legal/terms" element={<TermsOfService />} />
        
        {/* Dashboard Routes - Remove auth wrapper for now */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/prescriptions" element={<Prescriptions />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/billing/cart" element={<BillingCart />} />
        <Route path="/billing/cart/:prescriptionId" element={<BillingCart />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/business-optimization" element={<BusinessOptimization />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/admin" element={<Admin />} />
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
