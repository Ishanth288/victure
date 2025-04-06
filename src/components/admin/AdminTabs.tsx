
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnnouncementManager } from "./AnnouncementManager";
import { PricingPlanManager } from "./PricingPlanManager";

interface AdminTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  dashboardContent: React.ReactNode;
  systemContent: React.ReactNode;
  feedbackContent: React.ReactNode;
  usersContent: React.ReactNode;
  planContent: React.ReactNode;
}

export function AdminTabs({
  activeTab,
  onTabChange,
  dashboardContent,
  systemContent,
  feedbackContent,
  usersContent,
  planContent,
}: AdminTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
      <TabsList className="grid grid-cols-7 max-w-4xl">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="system">System</TabsTrigger>
        <TabsTrigger value="announcements">Announcements</TabsTrigger>
        <TabsTrigger value="feedback">Feedback</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="plans">Plans</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
      </TabsList>
      
      <TabsContent value="dashboard" className="space-y-4">
        {dashboardContent}
      </TabsContent>
      
      <TabsContent value="system" className="space-y-4">
        {systemContent}
      </TabsContent>
      
      <TabsContent value="announcements" className="space-y-4">
        <AnnouncementManager />
      </TabsContent>
      
      <TabsContent value="feedback" className="space-y-4">
        {feedbackContent}
      </TabsContent>
      
      <TabsContent value="users" className="space-y-4">
        {usersContent}
      </TabsContent>
      
      <TabsContent value="plans" className="space-y-4">
        {planContent}
      </TabsContent>
      
      <TabsContent value="pricing" className="space-y-4">
        <PricingPlanManager />
      </TabsContent>
    </Tabs>
  );
}
