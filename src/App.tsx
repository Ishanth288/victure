
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Insights from "@/pages/Insights";
import Admin from "@/pages/Admin";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import SystemSettings from "@/pages/admin/SystemSettings";
import Settings from "@/pages/Settings";
import Inventory from "@/pages/Inventory";
import Patients from "@/pages/Patients";
import Purchases from "@/pages/Purchases";
import BusinessOptimization from "@/pages/BusinessOptimization";
import Billing from "@/pages/Billing";
import BillingCart from "@/pages/BillingCart";
import Prescriptions from "@/pages/Prescriptions";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import TermsOfService from "@/pages/legal/TermsOfService";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import EULA from "@/pages/legal/EULA";
import SLA from "@/pages/legal/SLA";
import AcceptableUsePolicy from "@/pages/legal/AcceptableUsePolicy";
import RefundPolicy from "@/pages/legal/RefundPolicy";
import Disclaimers from "@/pages/legal/Disclaimers";
import { AdminCheck } from "@/components/admin/AdminCheck";
import AuthWrapper from "@/components/AuthWrapper";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="theme">
        <AuthWrapper>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/prescriptions" element={<Prescriptions />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/business-optimization" element={<BusinessOptimization />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/billing/cart" element={<BillingCart />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminCheck><Admin /></AdminCheck>} />
            <Route path="/admin/system-settings" element={<AdminCheck><SystemSettings /></AdminCheck>} />
            
            {/* Legal Routes */}
            <Route path="/legal/terms-of-service" element={<TermsOfService />} />
            <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/legal/eula" element={<EULA />} />
            <Route path="/legal/sla" element={<SLA />} />
            <Route path="/legal/acceptable-use-policy" element={<AcceptableUsePolicy />} />
            <Route path="/legal/refund-policy" element={<RefundPolicy />} />
            <Route path="/legal/disclaimers" element={<Disclaimers />} />
            
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
          <Toaster />
        </AuthWrapper>
      </ThemeProvider>
    </BrowserRouter>
  );
}
