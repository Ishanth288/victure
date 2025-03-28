
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import Billing from "@/pages/Billing";
import BillingCart from "@/pages/BillingCart";
import Patients from "@/pages/Patients";
import Prescriptions from "@/pages/Prescriptions";
import Insights from "@/pages/Insights";
import Purchases from "@/pages/Purchases";
import NotFound from "@/pages/NotFound";
import Settings from "@/pages/Settings";
import ChatbotButton from "@/components/chatbot/ChatbotButton";
import Navigation from "@/components/Navigation";

// Import legal pages
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import TermsOfService from "@/pages/legal/TermsOfService";
import EULA from "@/pages/legal/EULA";
import SLA from "@/pages/legal/SLA";
import RefundPolicy from "@/pages/legal/RefundPolicy";
import AcceptableUsePolicy from "@/pages/legal/AcceptableUsePolicy";
import Disclaimers from "@/pages/legal/Disclaimers";

function App() {
  return (
    <Router>
      <div className="h-screen w-full">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<><Navigation /><Auth /></>} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/billing/cart/:prescriptionId" element={<BillingCart />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Legal routes */}
          <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/legal/terms-of-service" element={<TermsOfService />} />
          <Route path="/legal/eula" element={<EULA />} />
          <Route path="/legal/sla" element={<SLA />} />
          <Route path="/legal/refund-policy" element={<RefundPolicy />} />
          <Route path="/legal/acceptable-use-policy" element={<AcceptableUsePolicy />} />
          <Route path="/legal/disclaimers" element={<Disclaimers />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatbotButton />
      </div>
    </Router>
  );
}

export default App;
