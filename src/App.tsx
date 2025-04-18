
import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthWrapper } from "@/components/AuthWrapper";
import BackButton from "@/components/BackButton";
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
import { MaintenanceChecker } from "@/components/admin/MaintenanceChecker";
import { AdminCheck } from "@/components/admin/AdminCheck";

function App() {
  return (
    <ErrorBoundary>
      <MaintenanceChecker>
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
          
          {/* Protected Routes - Wrap with AuthWrapper */}
          <Route path="/dashboard" element={
            <AuthWrapper>
              <Dashboard />
            </AuthWrapper>
          } />
          <Route path="/inventory" element={
            <AuthWrapper>
              <Inventory />
            </AuthWrapper>
          } />
          <Route path="/settings" element={
            <AuthWrapper>
              <Settings />
            </AuthWrapper>
          } />
          <Route path="/patients" element={
            <AuthWrapper>
              <Patients />
            </AuthWrapper>
          } />
          <Route path="/prescriptions" element={
            <AuthWrapper>
              <Prescriptions />
            </AuthWrapper>
          } />
          <Route path="/billing" element={
            <AuthWrapper>
              <Billing />
            </AuthWrapper>
          } />
          <Route path="/billing/cart" element={
            <AuthWrapper>
              <BillingCart />
            </AuthWrapper>
          } />
          <Route path="/billing/cart/:prescriptionId" element={
            <AuthWrapper>
              <BillingCart />
            </AuthWrapper>
          } />
          <Route path="/purchases" element={
            <AuthWrapper>
              <Purchases />
            </AuthWrapper>
          } />
          <Route path="/business-optimization" element={
            <AuthWrapper>
              <BusinessOptimization />
            </AuthWrapper>
          } />
          <Route path="/insights" element={
            <AuthWrapper>
              <Insights />
            </AuthWrapper>
          } />
          <Route path="/admin" element={
            <AdminCheck>
              <Admin />
            </AdminCheck>
          } />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        <BackButton />
      </MaintenanceChecker>
    </ErrorBoundary>
  );
}

export default App;
