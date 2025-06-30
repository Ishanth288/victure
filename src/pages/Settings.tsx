
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SecuritySettings from "@/components/settings/SecuritySettings";
import PharmacySettings from "@/components/settings/PharmacySettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import { DataMigration } from "@/components/settings/DataMigration";
import { SchemaRefreshButton } from "@/components/debug/SchemaRefreshButton";
export default function Settings() {
  return (
      <div className="space-y-6 pb-6">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and set preferences.
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="pharmacy" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="data-migration">Data Migration</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pharmacy" className="space-y-4">
            <PharmacySettings />
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <NotificationSettings />
          </TabsContent>
          
          <TabsContent value="data-migration" className="space-y-4">
            <DataMigration />
          </TabsContent>
          
          <TabsContent value="security" className="space-y-4">
            <SecuritySettings />
          </TabsContent>
          
          <TabsContent value="debug" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Debug Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Tools for troubleshooting database and schema issues.
                </p>
              </div>
              <SchemaRefreshButton />
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}
