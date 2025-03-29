import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Admin from "@/pages/Admin";
import Navigation from "@/components/Navigation";

// PageLoader with minimized animation for faster perceived load
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-10 h-10 rounded-full border-3 border-primary border-t-transparent animate-spin"></div>
  </div>
);

// Preload critical routes
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));

// Lazy load with higher delay for less critical routes
const Inventory = lazy(() => import("@/pages/Inventory"));

// Other lazy loaded routes
const Billing = lazy(() => import("@/pages/Billing"));
const BillingCart = lazy(() => import("@/pages/BillingCart"));
const Patients = lazy(() => import("@/pages/Patients"));
const Prescriptions = lazy(() => import("@/pages/Prescriptions"));
const Insights = lazy(() => import("@/pages/Insights"));
const Purchases = lazy(() => import("@/pages/Purchases"));
const Settings = lazy(() => import("@/pages/Settings"));
const BusinessOptimization = lazy(() => import("@/pages/BusinessOptimization"));

// Group legal pages to load together
const legalPages = {
  PrivacyPolicy: lazy(() => import("@/pages/legal/PrivacyPolicy")),
  TermsOfService: lazy(() => import("@/pages/legal/TermsOfService")),
  EULA: lazy(() => import("@/pages/legal/EULA")),
  SLA: lazy(() => import("@/pages/legal/SLA")),
  RefundPolicy: lazy(() => import("@/pages/legal/RefundPolicy")),
  AcceptableUsePolicy: lazy(() => import("@/pages/legal/AcceptableUsePolicy")),
  Disclaimers: lazy(() => import("@/pages/legal/Disclaimers"))
};

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/admin" element={<Admin />} />
        
        {/* Auth route with navigation */}
        <Route path="/auth" element={
          <Suspense fallback={<PageLoader />}>
            <><Navigation /><Auth /></>
          </Suspense>
        } />
        
        {/* Primary routes */}
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
        
        {/* Secondary routes */}
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
        
        {/* Legal routes */}
        <Route path="/legal/privacy-policy" element={
          <Suspense fallback={<PageLoader />}>
            <legalPages.PrivacyPolicy />
          </Suspense>
        } />
        
        <Route path="/legal/terms-of-service" element={
          <Suspense fallback={<PageLoader />}>
            <legalPages.TermsOfService />
          </Suspense>
        } />
        
        <Route path="/legal/eula" element={
          <Suspense fallback={<PageLoader />}>
            <legalPages.EULA />
          </Suspense>
        } />
        
        <Route path="/legal/sla" element={
          <Suspense fallback={<PageLoader />}>
            <legalPages.SLA />
          </Suspense>
        } />
        
        <Route path="/legal/refund-policy" element={
          <Suspense fallback={<PageLoader />}>
            <legalPages.RefundPolicy />
          </Suspense>
        } />
        
        <Route path="/legal/acceptable-use-policy" element={
          <Suspense fallback={<PageLoader />}>
            <legalPages.AcceptableUsePolicy />
          </Suspense>
        } />
        
        <Route path="/legal/disclaimers" element={
          <Suspense fallback={<PageLoader />}>
            <legalPages.Disclaimers />
          </Suspense>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
