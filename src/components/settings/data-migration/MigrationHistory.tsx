
import React from 'react';
import { format } from 'date-fns';
import { Trash2, HistoryIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { MigrationHistoryProps } from './types';
import { Badge } from "@/components/ui/badge";

export const MigrationHistory: React.FC<MigrationHistoryProps> = ({ 
  recentMigrations, 
  onRollback,
  isRollingBack
}) => {
  if (recentMigrations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <HistoryIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No migration history</h3>
        <p className="mt-1 text-sm text-gray-500">
          Your recent data imports will appear here
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Records</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentMigrations.map((migration) => (
          <TableRow key={migration.migration_id}>
            <TableCell>
              <Badge variant="outline">{migration.type}</Badge>
            </TableCell>
            <TableCell>{format(new Date(migration.timestamp), 'PPp')}</TableCell>
            <TableCell>{migration.added_count} added, {migration.skipped_count} skipped</TableCell>
            <TableCell>
              {migration.issues && migration.issues.length > 0 ? (
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
                  <span>With warnings</span>
                </div>
              ) : (
                <span className="text-green-600">Clean</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="sr-only">Rollback</span>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Rollback Migration</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete all {migration.added_count} records imported during this migration. 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={isRollingBack}
                      onClick={() => onRollback(migration.migration_id, migration.type)}
                    >
                      {isRollingBack ? 'Rolling back...' : 'Rollback'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
