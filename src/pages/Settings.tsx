
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SecuritySettings from "@/components/settings/SecuritySettings";
import PharmacySettings from "@/components/settings/PharmacySettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import { DataMigration } from "@/components/settings/DataMigration";
import DashboardLayout from "@/components/DashboardLayout";
import { AuthProvider } from '@/hooks/useAuth';

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6 h-full pb-6">
        <div className="flex-none">
          <div className="flex justify-between">
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account settings and set preferences.
              </p>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="pharmacy" className="flex-1 flex flex-col">
          <TabsList className="flex-none">
            <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="data-migration">Data Migration</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <div className="flex-1">
            <TabsContent value="pharmacy" className="h-full data-[state=active]:block data-[state=inactive]:hidden">
              <PharmacySettings />
            </TabsContent>
            
            <TabsContent value="notifications" className="h-full data-[state=active]:block data-[state=inactive]:hidden">
              <NotificationSettings />
            </TabsContent>
            
            <TabsContent value="data-migration" className="h-full data-[state=active]:flex data-[state=inactive]:hidden">
              <AuthProvider>
                <DataMigration />
              </AuthProvider>
            </TabsContent>
            
            <TabsContent value="security" className="h-full data-[state=active]:block data-[state=inactive]:hidden">
              <SecuritySettings />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
