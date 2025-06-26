import { lazy, Suspense } from "react";
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


const Admin = lazy(() => import("./pages/Admin"));
const SystemSettings = lazy(() => import("./pages/admin/SystemSettings"));
const DeletionHistory = lazy(() => import("./pages/DeletionHistory"));
const SystemTest = lazy(() => import("./pages/SystemTest"));
const BusinessOptimization = lazy(() => import("./pages/BusinessOptimization"));
const Documentation = lazy(() => import("./pages/Documentation"));
const WhatsAppPage = lazy(() => import("./pages/WhatsApp")); // Added WhatsAppPage import


function App() {
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
            <AuthWrapper>
                  <div className="min-h-screen bg-gray-50">
                    <ConnectionHealthMonitor />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
                    <Route path="/inventory" element={<DashboardLayout><Inventory /></DashboardLayout>} />
                    <Route path="/patients" element={<DashboardLayout><Patients /></DashboardLayout>} />
                    <Route path="/prescriptions" element={<DashboardLayout><Prescriptions /></DashboardLayout>} />
                    <Route path="/insights" element={<DashboardLayout><Insights /></DashboardLayout>} />
                    <Route path="/billing" element={<DashboardLayout><Billing /></DashboardLayout>} />
                    <Route path="/billing-cart" element={<DashboardLayout><BillingCart /></DashboardLayout>} />
                    <Route path="/purchases" element={<DashboardLayout><Purchases /></DashboardLayout>} />
                    <Route 
                      path="/admin" 
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                          <DashboardLayout><Admin /></DashboardLayout>
                        </Suspense>
                      } 
                    />
                    <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
                    <Route 
                      path="/admin/settings" 
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                          <SystemSettings />
                        </Suspense>
                      } 
                    />
                    <Route 
                      path="/deletion-history" 
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                          <DashboardLayout><DeletionHistory /></DashboardLayout>
                        </Suspense>
                      } 
                    />
                    <Route 
                      path="/system-test" 
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                          <SystemTest />
                        </Suspense>
                      } 
                    />
                    <Route 
                      path="/business-optimization"
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                          <DashboardLayout><BusinessOptimization /></DashboardLayout>
                        </Suspense>
                      } 
                    />
                    <Route 
                      path="/documentation" 
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                          <Documentation />
                        </Suspense>
                      } 
                    />
                    <Route 
                      path="/whatsapp" // Added WhatsApp route
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                          <DashboardLayout><WhatsAppPage /></DashboardLayout>
                        </Suspense>
                      } 
                    />
                  </Routes>
                </div>
            </AuthWrapper>
    </ErrorBoundary>
  );
}

export default App;
