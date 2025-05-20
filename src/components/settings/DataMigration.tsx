
import React, { useState, useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { stableToast } from "@/components/ui/stable-toast";
import { MigrationHistory } from "./data-migration/MigrationHistory";
import { ImportTabContent } from "./data-migration/ImportTabContent";
import { getRecentMigrations, rollbackMigration } from "@/utils/migration";

export function DataMigration() {
  const { user } = useAuth();
  const [recentMigrations, setRecentMigrations] = useState<any[]>([]);
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Load migration history
  useEffect(() => {
    loadMigrationHistory();
  }, []);

  const loadMigrationHistory = async () => {
    try {
      const migrations = await getRecentMigrations();
      setRecentMigrations(migrations);
    } catch (err) {
      console.error('Failed to load migration history:', err);
      stableToast({
        title: "Error",
        description: "Could not load migration history",
        variant: "destructive",
      });
    }
  };

  const handleRollback = async (migrationId: string, type: 'Inventory' | 'Patients' | 'Prescriptions') => {
    setIsRollingBack(true);
    
    try {
      const success = await rollbackMigration(migrationId, type);
      
      if (success) {
        stableToast({
          title: "Rollback Successful",
          description: `Successfully rolled back ${type} migration`,
          variant: "success",
        });
        
        // Refresh migration history
        loadMigrationHistory();
      } else {
        stableToast({
          title: "Rollback Failed",
          description: `Failed to roll back ${type} migration`,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Rollback error:', err);
      stableToast({
        title: "Rollback Failed",
        description: `Error: ${err}`,
        variant: "destructive",
      });
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Migration</CardTitle>
        <CardDescription>
          Import data from other pharmacy systems
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="import" className="w-full">
          <TabsList>
            <TabsTrigger value="import">Import Data</TabsTrigger>
            <TabsTrigger value="history">Migration History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="space-y-6">
            <ImportTabContent user={user} loadMigrationHistory={loadMigrationHistory} />
          </TabsContent>
          
          <TabsContent value="history">
            <MigrationHistory 
              recentMigrations={recentMigrations} 
              onRollback={handleRollback}
              isRollingBack={isRollingBack}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
