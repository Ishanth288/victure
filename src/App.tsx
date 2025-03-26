
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
          {/* Catch all route for 404 */}
          <Route path="/not-found" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ChatbotButton />
      </div>
    </Router>
  );
}

export default App;
