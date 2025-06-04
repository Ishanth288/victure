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
const MobileDashboard = React.lazy(() => import("./components/mobile/MobileDashboard"));
const MobileInventory = React.lazy(() => import("./components/mobile/MobileInventory"));
const MobilePatients = React.lazy(() => import("./components/mobile/MobilePatients"));
const MobileSettings = React.lazy(() => import("./components/mobile/MobileSettings"));

// Apple-style mobile loading component
function MobileLoadingFallback({ text = "Loading..." }: { text?: string }) {
  if (isMobileDevice()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center safe-area-all">
        <div className="text-center animate-bounce-in">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse-apple"></div>
            <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <span className="text-2xl font-bold text-white">V</span>
            </div>
          </div>
          <p className="text-title-3 font-semibold text-gray-900 dark:text-white mb-2">Victure Healthcare</p>
          <p className="text-body text-gray-600 dark:text-gray-400">{text}</p>
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
        
        {/* Mobile-specific routes with Apple-quality design */}
        <Route path="/mobile" element={<MobileDashboard />} />
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
          showConnectionStatus={false}
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
      
      {/* Development and Debug Tools - ONLY FOR DESKTOP */}
      {!isMobileDevice() && (
        <>
          <PerformanceMonitor />
          <ConnectionMonitor compact={true} />
        </>
      )}
    </ErrorBoundary>
  );
}

export default App;
