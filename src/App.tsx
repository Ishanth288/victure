
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthWrapper } from "@/components/AuthWrapper";
import { ConnectionErrorBoundary } from "@/components/ConnectionErrorBoundary";
import { BillingProvider } from "@/contexts/BillingContext";
import { InventoryProvider } from "@/contexts/InventoryContext";

// Pages
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import Billing from "@/pages/Billing";
import Patients from "@/pages/Patients";
import Inventory from "@/pages/Inventory";
import Insights from "@/pages/Insights";
import BusinessOptimization from "@/pages/BusinessOptimization";
import Purchases from "@/pages/Purchases";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.message?.includes('auth') || error?.message?.includes('401')) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ConnectionErrorBoundary>
          <BrowserRouter>
            <AuthWrapper>
              <BillingProvider>
                <InventoryProvider>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/patients" element={<Patients />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/insights" element={<Insights />} />
                    <Route path="/business-optimization" element={<BusinessOptimization />} />
                    <Route path="/purchases" element={<Purchases />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/profile" element={<Profile />} />
                  </Routes>
                </InventoryProvider>
              </BillingProvider>
            </AuthWrapper>
            <Toaster />
            <SonnerToaster />
          </BrowserRouter>
        </ConnectionErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
