
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SecuritySettings from "@/components/settings/SecuritySettings";
import PharmacySettings from "@/components/settings/PharmacySettings";
import { DataMigration } from "@/components/settings/DataMigration";
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
            <TabsTrigger value="data-migration">Data Migration</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pharmacy" className="space-y-4">
            <PharmacySettings />
          </TabsContent>
          
          <TabsContent value="data-migration" className="space-y-4">
            <DataMigration />
          </TabsContent>
          
          <TabsContent value="security" className="space-y-4">
            <SecuritySettings />
          </TabsContent>
        </Tabs>
      </div>
  );
}
