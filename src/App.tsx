
import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Admin from "@/pages/Admin";
import Navigation from "@/components/Navigation";

// Lazy load pages to reduce initial bundle size
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Billing = lazy(() => import("@/pages/Billing"));
const BillingCart = lazy(() => import("@/pages/BillingCart"));
const Patients = lazy(() => import("@/pages/Patients"));
const Prescriptions = lazy(() => import("@/pages/Prescriptions"));
const Insights = lazy(() => import("@/pages/Insights"));
const Purchases = lazy(() => import("@/pages/Purchases"));
const Settings = lazy(() => import("@/pages/Settings"));
const BusinessOptimization = lazy(() => import("@/pages/BusinessOptimization"));

// Lazy load legal pages
const PrivacyPolicy = lazy(() => import("@/pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/legal/TermsOfService"));
const EULA = lazy(() => import("@/pages/legal/EULA"));
const SLA = lazy(() => import("@/pages/legal/SLA"));
const RefundPolicy = lazy(() => import("@/pages/legal/RefundPolicy"));
const AcceptableUsePolicy = lazy(() => import("@/pages/legal/AcceptableUsePolicy"));
const Disclaimers = lazy(() => import("@/pages/legal/Disclaimers"));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
  </div>
);

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/auth" element={
          <Suspense fallback={<PageLoader />}>
            <><Navigation /><Auth /></>
          </Suspense>
        } />
        <Route path="/dashboard" element={
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        } />
        <Route path="/inventory" element={
          <Suspense fallback={<PageLoader />}>
            <Inventory />
          </Suspense>
        } />
        <Route path="/billing" element={
          <Suspense fallback={<PageLoader />}>
            <Billing />
          </Suspense>
        } />
        <Route path="/billing/cart/:prescriptionId" element={
          <Suspense fallback={<PageLoader />}>
            <BillingCart />
          </Suspense>
        } />
        <Route path="/patients" element={
          <Suspense fallback={<PageLoader />}>
            <Patients />
          </Suspense>
        } />
        <Route path="/prescriptions" element={
          <Suspense fallback={<PageLoader />}>
            <Prescriptions />
          </Suspense>
        } />
        <Route path="/insights" element={
          <Suspense fallback={<PageLoader />}>
            <Insights />
          </Suspense>
        } />
        <Route path="/purchases" element={
          <Suspense fallback={<PageLoader />}>
            <Purchases />
          </Suspense>
        } />
        <Route path="/settings" element={
          <Suspense fallback={<PageLoader />}>
            <Settings />
          </Suspense>
        } />
        <Route path="/business-optimization" element={
          <Suspense fallback={<PageLoader />}>
            <BusinessOptimization />
          </Suspense>
        } />
        
        {/* Legal routes - removed Navigation component */}
        <Route path="/legal/privacy-policy" element={
          <Suspense fallback={<PageLoader />}>
            <PrivacyPolicy />
          </Suspense>
        } />
        <Route path="/legal/terms-of-service" element={
          <Suspense fallback={<PageLoader />}>
            <TermsOfService />
          </Suspense>
        } />
        <Route path="/legal/eula" element={
          <Suspense fallback={<PageLoader />}>
            <EULA />
          </Suspense>
        } />
        <Route path="/legal/sla" element={
          <Suspense fallback={<PageLoader />}>
            <SLA />
          </Suspense>
        } />
        <Route path="/legal/refund-policy" element={
          <Suspense fallback={<PageLoader />}>
            <RefundPolicy />
          </Suspense>
        } />
        <Route path="/legal/acceptable-use-policy" element={
          <Suspense fallback={<PageLoader />}>
            <AcceptableUsePolicy />
          </Suspense>
        } />
        <Route path="/legal/disclaimers" element={
          <Suspense fallback={<PageLoader />}>
            <Disclaimers />
          </Suspense>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
