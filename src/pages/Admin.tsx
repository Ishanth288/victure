
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FeedbackList } from "@/components/admin/FeedbackList";
import { UserManagement } from "@/components/admin/UserManagement";
import SystemSettings from "@/pages/admin/SystemSettings";
import { AdminDashboard } from "@/components/admin/dashboard/AdminDashboard";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useAdminAccess } from "@/hooks/useAdminAccess";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { stats, isLoading } = useAdminStats();
  const { isLoading: isAccessLoading, isAuthorized } = useAdminAccess();
  
  if (isAccessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Verifying admin credentials...</p>
        </div>
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
        />
      </div>
    </DashboardLayout>
  );
}
