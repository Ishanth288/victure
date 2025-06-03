
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Billing from "./pages/Billing";
import BillingCart from "./pages/BillingCart";
import Patients from "./pages/Patients";
import Prescriptions from "./pages/Prescriptions";
import Purchases from "./pages/Purchases";
import Settings from "./pages/Settings";
import Insights from "./pages/Insights";
import BusinessOptimization from "./pages/BusinessOptimization";
import Documentation from "./pages/Documentation";
import Admin from "./pages/Admin";
import SystemSettings from "./pages/admin/SystemSettings";
import NotFound from "./pages/NotFound";
import LegalLayout from "./components/layouts/LegalLayout";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import RefundPolicy from "./pages/legal/RefundPolicy";
import Disclaimers from "./pages/legal/Disclaimers";
import EULA from "./pages/legal/EULA";
import SLA from "./pages/legal/SLA";
import AcceptableUsePolicy from "./pages/legal/AcceptableUsePolicy";
import { MobileAppWrapper } from "./components/mobile/MobileAppWrapper";
import { Capacitor } from "@capacitor/core";

function App() {
  // Log platform information for debugging
  console.log('App starting - Platform:', Capacitor.getPlatform(), 'isNative:', Capacitor.isNativePlatform());
  
  return (
    <MobileAppWrapper>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/cart" element={<BillingCart />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/prescriptions" element={<Prescriptions />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/business-optimization" element={<BusinessOptimization />} />
        <Route path="/documentation" element={<Documentation />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/settings" element={<SystemSettings />} />
        <Route path="/legal" element={<LegalLayout />}>
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="terms" element={<TermsOfService />} />
          <Route path="refund" element={<RefundPolicy />} />
          <Route path="disclaimers" element={<Disclaimers />} />
          <Route path="eula" element={<EULA />} />
          <Route path="sla" element={<SLA />} />
          <Route path="acceptable-use" element={<AcceptableUsePolicy />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MobileAppWrapper>
  );
}

export default App;
