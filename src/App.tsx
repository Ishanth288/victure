
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import Billing from "@/pages/Billing";
import BillingCart from "@/pages/BillingCart";
import Prescriptions from "@/pages/Prescriptions";
import Patients from "@/pages/Patients";
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
        <Route path="/prescriptions" element={<Prescriptions />} />
        <Route path="/patients" element={<Patients />} />
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
