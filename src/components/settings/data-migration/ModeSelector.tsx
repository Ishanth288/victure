
import React from 'react';
import { Database, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MigrationMode } from './types';

interface ModeSelectorProps {
  migrationMode: MigrationMode;
  setMigrationMode: (mode: MigrationMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ migrationMode, setMigrationMode }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Button
        variant={migrationMode === 'Inventory' ? 'default' : 'outline'}
        className="flex flex-col items-center justify-center h-24"
        onClick={() => setMigrationMode('Inventory')}
      >
        <Database className="h-8 w-8 mb-2" />
        <span>Inventory</span>
      </Button>
      
      <Button
        variant={migrationMode === 'Patients' ? 'default' : 'outline'}
        className="flex flex-col items-center justify-center h-24"
        onClick={() => setMigrationMode('Patients')}
      >
        <Users className="h-8 w-8 mb-2" />
        <span>Patients</span>
      </Button>
      
      <Button
        variant={migrationMode === 'Prescriptions' ? 'default' : 'outline'}
        className="flex flex-col items-center justify-center h-24"
        onClick={() => setMigrationMode('Prescriptions')}
      >
        <FileText className="h-8 w-8 mb-2" />
        <span>Prescriptions</span>
      </Button>
    </div>
  );
};
