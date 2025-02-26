
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import Billing from "@/pages/Billing";
import BillingCart from "@/pages/BillingCart";
import Inventory from "@/pages/Inventory";
import Prescriptions from "@/pages/Prescriptions";
import Patients from "@/pages/Patients";
import Insights from "@/pages/Insights";
import { Toaster } from "@/components/ui/toaster";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/billing/cart/:prescriptionId" element={<BillingCart />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/prescriptions" element={<Prescriptions />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
