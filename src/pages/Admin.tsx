
import { useState } from "react";
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

export default function Admin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { stats, isLoading } = useAdminStats();
  const { isLoading: isAccessLoading, isAuthorized } = useAdminAccess();
  
  if (isAccessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <LoadingAnimation text="Verifying admin credentials" size="lg" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Access check will redirect if not authorized
  }

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
