
import React from 'react';
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelative } from 'date-fns';

interface MigrationHistoryProps {
  recentMigrations: Array<{
    id: string;
    migration_id: string;
    type: 'Inventory' | 'Patients' | 'Prescriptions';
    timestamp: string;
    added_count: number;
    skipped_count: number;
  }>;
  onRollback: (migrationId: string, type: 'Inventory' | 'Patients' | 'Prescriptions') => void;
  isRollingBack: boolean;
}

export const MigrationHistory: React.FC<MigrationHistoryProps> = ({
  recentMigrations,
  onRollback,
  isRollingBack
}) => {
  // Format date to relative time (e.g., "3 days ago")
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatRelative(date, new Date());
    } catch (err) {
      return dateString;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Inventory':
        return '📦';
      case 'Patients':
        return '👤';
      case 'Prescriptions':
        return '📝';
      default:
        return '📄';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-medium mb-4">Recent Data Migrations</h3>
      
      {recentMigrations.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 border rounded-md">
          <p className="text-gray-500">No migration history available.</p>
          <p className="text-sm text-gray-400 mt-2">
            Import data to see your migration history.
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-4">
            {recentMigrations.map((migration) => (
              <div 
                key={migration.id}
                className="bg-white border rounded-md p-4 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {getTypeIcon(migration.type)}
                    </span>
                    <div>
                      <h4 className="font-medium">{migration.type} Import</h4>
                      <p className="text-sm text-gray-500">
                        {formatDate(migration.timestamp)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRollback(migration.migration_id, migration.type)}
                    disabled={isRollingBack}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                  >
                    <Undo2 className="mr-2 h-4 w-4" />
                    Rollback
                  </Button>
                </div>
                <div className="mt-3 text-sm">
                  <span className="text-green-600 font-medium">
                    {migration.added_count} added
                  </span>
                  {migration.skipped_count > 0 && (
                    <span className="text-amber-600 ml-3">
                      {migration.skipped_count} skipped
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
