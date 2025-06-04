import React, { Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import { MobileAppWrapper } from "./components/mobile/MobileAppWrapper";
import { MobileOptimizedWrapper } from "./components/mobile/MobileOptimizedWrapper";
import { Capacitor } from "@capacitor/core";
import { LoadingAnimation } from "./components/ui/loading-animation";
import { ErrorBoundary } from "./components/ErrorBoundary"; // Import ErrorBoundary
import { autoInitializeMobileOptimizations, isMobileDevice } from "./utils/mobileOptimizer";
import { setupNetworkMonitoring } from "./utils/realTimeOptimizer";
import { PerformanceMonitor } from "./components/debug/PerformanceMonitor";
import { ConnectionMonitor } from "./components/ConnectionMonitor";

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
const DeletionHistory = React.lazy(() => import("./pages/DeletionHistory"));
const Documentation = React.lazy(() => import("./pages/Documentation"));
const Admin = React.lazy(() => import("./pages/Admin"));
const SystemSettings = React.lazy(() => import("./pages/admin/SystemSettings"));
const SystemTest = React.lazy(() => import("./pages/SystemTest"));
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

// Mobile-optimized loading component
function MobileLoadingFallback({ text = "Loading page..." }: { text?: string }) {
  if (isMobileDevice()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 to-green-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-white text-2xl font-bold">V</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-teal-800 font-medium">{text}</p>
        </div>
      </div>
    );
  }
  
  return <LoadingAnimation showLogo={true} text={text} size="lg" />;
}

function App() {
  // Log platform information for debugging
  console.log('App starting - Platform:', Capacitor.getPlatform(), 'isNative:', Capacitor.isNativePlatform());
  
  // Initialize performance optimizations
  useEffect(() => {
    console.log('🚀 Initializing performance optimizations');
    
    // Initialize mobile optimizations if on mobile
    const cleanupMobile = autoInitializeMobileOptimizations();
    
    // Setup network monitoring for real-time subscriptions
    const cleanupNetwork = setupNetworkMonitoring();
    
    // Add mobile-specific CSS improvements
    if (isMobileDevice()) {
      const style = document.createElement('style');
      style.innerHTML = `
        /* Mobile-specific optimizations */
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        
        /* Improve tap highlight */
        * {
          -webkit-tap-highlight-color: rgba(20, 184, 166, 0.1);
        }
        
        /* Better mobile form styling */
        input, select, textarea {
          font-size: 16px; /* Prevent zoom on iOS */
        }
        
        /* Optimize scrolling */
        .page-container {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      cleanupMobile();
      cleanupNetwork();
      console.log('🧹 Performance optimizations cleaned up');
    };
  }, []);

  const AppContent = () => (
    <Suspense fallback={<MobileLoadingFallback />}>
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
        <Route path="/deletion-history" element={<DeletionHistory />} />
        <Route path="/documentation" element={<Documentation />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/settings" element={<SystemSettings />} />
        <Route path="/system-test" element={<SystemTest />} />
        
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
  );
  
  return (
    <ErrorBoundary>
      {isMobileDevice() ? (
        <MobileOptimizedWrapper
          loadingText="Initializing Victure..."
          enableHaptics={true}
          showConnectionStatus={true}
        >
          <MobileAppWrapper>
            <div className="page-container">
              <AppContent />
            </div>
          </MobileAppWrapper>
        </MobileOptimizedWrapper>
      ) : (
        <MobileAppWrapper>
          <div className="page-container">
            <AppContent />
          </div>
        </MobileAppWrapper>
      )}
      
      {/* Development and Debug Tools */}
      <PerformanceMonitor />
      <ConnectionMonitor compact={true} />
    </ErrorBoundary>
  );
}

export default App;
