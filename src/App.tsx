import { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Patients from "./pages/Patients";
import Prescriptions from "./pages/Prescriptions";
import Insights from "./pages/Insights";
import BillingCart from "./pages/BillingCart";
import Billing from "./pages/Billing";
import Purchases from "./pages/Purchases";
import { AuthWrapper } from "@/components/AuthWrapper";
import DashboardLayout from "@/components/DashboardLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ConnectionHealthMonitor } from "@/components/ConnectionHealthMonitor";
import Settings from "./pages/Settings";
import { refreshSupabaseSchema } from "@/utils/schemaRefresh";


const Admin = lazy(() => import("./pages/Admin"));
const SystemSettings = lazy(() => import("./pages/admin/SystemSettings"));
const DeletionHistory = lazy(() => import("./pages/DeletionHistory"));
const SystemTest = lazy(() => import("./pages/SystemTest"));
const BusinessOptimization = lazy(() => import("./pages/BusinessOptimization"));
const Documentation = lazy(() => import("./pages/Documentation"));
const Blog = lazy(() => import("./pages/Blog"));
// Legal pages
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const RefundPolicy = lazy(() => import("./pages/legal/RefundPolicy"));
const SLA = lazy(() => import("./pages/legal/SLA"));
const EULA = lazy(() => import("./pages/legal/EULA"));
const AcceptableUsePolicy = lazy(() => import("./pages/legal/AcceptableUsePolicy"));
const Disclaimers = lazy(() => import("./pages/legal/Disclaimers"));
// const WhatsAppPage = lazy(() => import("./pages/whatsapp")); // Temporarily disabled for Vercel build


function App() {
  // Refresh schema cache on app load to resolve relationship errors
  useEffect(() => {
    const initializeSchema = async () => {
      try {
        await refreshSupabaseSchema();
      } catch (error) {
        console.warn('Schema refresh failed on app load:', error);
      }
    };
    
    initializeSchema();
  }, []);

  return (
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error('App Error:', error, errorInfo);
          // Send to monitoring service
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'exception', {
              description: error.message,
              fatal: false
            });
          }
        }}
      >
        <div className="min-h-screen bg-gray-50">
          <ConnectionHealthMonitor />
          <Routes>
            {/* Public routes - no authentication required */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/documentation" 
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <Documentation />
                </Suspense>
              } 
            />
            <Route 
              path="/blog" 
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <Blog />
                </Suspense>
              } 
            />
            {/* Legal Routes - public access */}
            <Route 
              path="/legal/privacy-policy" 
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <PrivacyPolicy />
                </Suspense>
              } 
            />
            <Route 
              path="/legal/terms" 
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <TermsOfService />
                </Suspense>
              } 
            />
            <Route 
              path="/legal/refund-policy" 
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <RefundPolicy />
                </Suspense>
              } 
            />
            <Route 
              path="/legal/sla" 
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <SLA />
                </Suspense>
              } 
            />
            <Route 
              path="/legal/eula" 
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <EULA />
                </Suspense>
              } 
            />
            <Route 
              path="/legal/acceptable-use" 
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <AcceptableUsePolicy />
                </Suspense>
              } 
            />
            <Route 
              path="/legal/disclaimers" 
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <Disclaimers />
                </Suspense>
              } 
            />
            
            {/* Protected routes - authentication required */}
            <Route path="/dashboard" element={<AuthWrapper><DashboardLayout><Dashboard /></DashboardLayout></AuthWrapper>} />
            <Route path="/inventory" element={<AuthWrapper><DashboardLayout><Inventory /></DashboardLayout></AuthWrapper>} />
            <Route path="/patients" element={<AuthWrapper><DashboardLayout><Patients /></DashboardLayout></AuthWrapper>} />
            <Route path="/prescriptions" element={<AuthWrapper><DashboardLayout><Prescriptions /></DashboardLayout></AuthWrapper>} />
            <Route path="/insights" element={<AuthWrapper><DashboardLayout><Insights /></DashboardLayout></AuthWrapper>} />
            <Route path="/billing" element={<AuthWrapper><DashboardLayout><Billing /></DashboardLayout></AuthWrapper>} />
            <Route path="/billing-cart" element={<AuthWrapper><DashboardLayout><BillingCart /></DashboardLayout></AuthWrapper>} />
            <Route path="/purchases" element={<AuthWrapper><DashboardLayout><Purchases /></DashboardLayout></AuthWrapper>} />
            <Route 
              path="/admin" 
              element={
                <AuthWrapper>
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <DashboardLayout><Admin /></DashboardLayout>
                  </Suspense>
                </AuthWrapper>
              } 
            />
            <Route path="/settings" element={<AuthWrapper><DashboardLayout><Settings /></DashboardLayout></AuthWrapper>} />
            <Route 
              path="/admin/settings" 
              element={
                <AuthWrapper>
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <SystemSettings />
                  </Suspense>
                </AuthWrapper>
              } 
            />
            <Route 
              path="/deletion-history" 
              element={
                <AuthWrapper>
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <DashboardLayout><DeletionHistory /></DashboardLayout>
                  </Suspense>
                </AuthWrapper>
              } 
            />
            <Route 
              path="/system-test" 
              element={
                <AuthWrapper>
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <SystemTest />
                  </Suspense>
                </AuthWrapper>
              } 
            />
            <Route 
              path="/business-optimization"
              element={
                <AuthWrapper>
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <DashboardLayout><BusinessOptimization /></DashboardLayout>
                  </Suspense>
                </AuthWrapper>
              } 
            />

            {/* Temporarily disabled WhatsApp route for Vercel build
            <Route 
              path="/whatsapp"
              element={
                <AuthWrapper>
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <DashboardLayout><WhatsAppPage /></DashboardLayout>
                  </Suspense>
                </AuthWrapper>
              } 
            />
            */}
            </Routes>
          </div>
        </ErrorBoundary>
      );
}

export default App;
