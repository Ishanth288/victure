import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import { BillingProvider } from "./contexts/BillingContext";
import { InventoryProvider } from "./contexts/InventoryContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ConnectionHealthMonitor } from "@/components/ConnectionHealthMonitor";
import Settings from "./pages/Settings";
import DashboardLayout from "./components/DashboardLayout";

const Admin = lazy(() => import("./pages/Admin"));
const SystemSettings = lazy(() => import("./pages/admin/SystemSettings"));
const DeletionHistory = lazy(() => import("./pages/DeletionHistory"));
const SystemTest = lazy(() => import("./pages/SystemTest"));
const BusinessOptimization = lazy(() => import("./pages/BusinessOptimization"));
const Documentation = lazy(() => import("./pages/Documentation"));
const WhatsAppPage = lazy(() => import("./pages/WhatsApp")); // Added WhatsAppPage import

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

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
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/patients" element={<Patients />} />
                    <Route path="/prescriptions" element={<Prescriptions />} />
                    <Route path="/insights" element={<Insights />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/billing-cart" element={<BillingCart />} />
                    <Route path="/purchases" element={<Purchases />} />
                    <Route 
                      path="/admin" 
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                          <Admin />
                        </Suspense>
                      } 
                    />
                    <Route path="/settings" element={<Settings />} />
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
                          <DeletionHistory />
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
                        <DashboardLayout>
                          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                            <BusinessOptimization />
                          </Suspense>
                        </DashboardLayout>
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
                          <WhatsAppPage />
                        </Suspense>
                      } 
                    />
                  </Routes>
                </div>
            </AuthWrapper>
          <Toaster />
          <Sonner />
    </ErrorBoundary>
  );
}

export default App;
