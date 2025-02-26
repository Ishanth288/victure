
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SecuritySettings from "@/components/settings/SecuritySettings";
import PharmacySettings from "@/components/settings/PharmacySettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import DashboardLayout from "@/components/DashboardLayout";

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        
        <Tabs defaultValue="security" className="space-y-4">
          <TabsList>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="pharmacy">Pharmacy Details</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="pharmacy">
            <PharmacySettings />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
