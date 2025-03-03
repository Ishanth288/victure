
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import Billing from "@/pages/Billing";
import BillingCart from "@/pages/BillingCart";
import Prescriptions from "@/pages/Patients";
import Patients from "@/pages/Prescriptions";
import Insights from "@/pages/Insights";
import Purchases from "@/pages/Purchases";
import NotFound from "@/pages/NotFound";
import Settings from "@/pages/Settings";
import ChatbotButton from "@/components/chatbot/ChatbotButton";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/billing/cart/:prescriptionId" element={<BillingCart />} />
        <Route path="/prescriptions" element={<Patients />} />
        <Route path="/patients" element={<Prescriptions />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ChatbotButton />
    </Router>
  );
}

export default App;
