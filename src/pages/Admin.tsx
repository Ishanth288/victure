
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { FeedbackList } from "@/components/admin/FeedbackList";
import { UserManagement } from "@/components/admin/UserManagement";
import { PlanManagement } from "@/components/admin/PlanManagement";
import SystemSettings from "@/pages/admin/SystemSettings";
import { AdminDashboard } from "@/components/admin/dashboard/AdminDashboard";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { SecurityCodeModal } from "@/components/admin/SecurityCodeModal";

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { stats, isLoading } = useAdminStats();
  const { 
    isLoading: isAccessLoading, 
    isAuthorized, 
    showSecurityModal, 
    setShowSecurityModal, 
    handleSecurityVerification 
  } = useAdminAccess();
  
  // Display loading state while checking access
  if (isAccessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <LoadingAnimation text="Verifying admin credentials" size="lg" />
      </div>
    );
  }

  // Show only the security modal while waiting for authorization
  if (!isAuthorized) {
    return (
      <SecurityCodeModal 
        isOpen={showSecurityModal}
        onClose={() => {
          // When modal is closed without verification, redirect to dashboard
          setShowSecurityModal(false);
          navigate('/dashboard');
        }}
        onVerified={handleSecurityVerification}
      />
    );
  }

  // Once authorized, show the admin portal
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-3xl font-bold">Admin Portal</h1>
        </div>

        <AdminTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          dashboardContent={<AdminDashboard stats={stats} isLoading={isLoading} />}
          systemContent={<SystemSettings />}
          feedbackContent={<FeedbackList />}
          usersContent={<UserManagement />}
          planContent={<PlanManagement />}
        />
      </div>
    </DashboardLayout>
  );
}
