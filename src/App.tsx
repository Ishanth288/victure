
import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import { MobileAppWrapper } from "./components/mobile/MobileAppWrapper";
import { Capacitor } from "@capacitor/core";
import { LoadingAnimation } from "./components/ui/loading-animation";
import { ErrorBoundary } from "./components/ErrorBoundary"; // Import ErrorBoundary

// Lazy load main application pages
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Inventory = React.lazy(() => import("./pages/Inventory"));
const Billing = React.lazy(() => import("./pages/Billing"));
const BillingCart = React.lazy(() => import("./pages/BillingCart"));
const Patients = React.lazy(() => import("./pages/Patients"));
const Prescriptions = React.lazy(() => import("./pages/Prescriptions"));
const Purchases = React.lazy(() => import("./pages/Purchases"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Insights = React.lazy(() => import("./pages/Insights"));
const BusinessOptimization = React.lazy(() => import("./pages/BusinessOptimization"));
const Documentation = React.lazy(() => import("./pages/Documentation"));
const Admin = React.lazy(() => import("./pages/Admin"));
const SystemSettings = React.lazy(() => import("./pages/admin/SystemSettings"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// Lazy load legal pages
const LegalLayout = React.lazy(() => import("./components/layouts/LegalLayout"));
const PrivacyPolicy = React.lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("./pages/legal/TermsOfService"));
const RefundPolicy = React.lazy(() => import("./pages/legal/RefundPolicy"));
const Disclaimers = React.lazy(() => import("./pages/legal/Disclaimers"));
const EULA = React.lazy(() => import("./pages/legal/EULA"));
const SLA = React.lazy(() => import("./pages/legal/SLA"));
const AcceptableUsePolicy = React.lazy(() => import("./pages/legal/AcceptableUsePolicy"));

// Lazy load mobile-specific pages
const MobileInventory = React.lazy(() => import("./components/mobile/MobileInventory"));
const MobilePatients = React.lazy(() => import("./components/mobile/MobilePatients"));
const MobileSettings = React.lazy(() => import("./components/mobile/MobileSettings"));

function App() {
  // Log platform information for debugging
  console.log('App starting - Platform:', Capacitor.getPlatform(), 'isNative:', Capacitor.isNativePlatform());
  
  return (
    <ErrorBoundary>
      <MobileAppWrapper>
        <Suspense fallback={<LoadingAnimation showLogo={true} text="Loading page..." size="lg" />}>
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
            
            {/* Mobile-specific routes */}
            <Route path="/mobile/inventory" element={<MobileInventory />} />
            <Route path="/mobile/patients" element={<MobilePatients />} />
            <Route path="/mobile/settings" element={<MobileSettings />} />
            
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
        </Suspense>
      </MobileAppWrapper>
    </ErrorBoundary>
  );
}

export default App;
