
import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface RollbackHandlerProps {
  isRollingBack: boolean;
  handleRollback: (migrationId: string, type: 'Inventory' | 'Patients' | 'Prescriptions') => Promise<void>;
}

export const RollbackHandler: React.FC<RollbackHandlerProps> = ({ 
  isRollingBack,
  handleRollback
}) => {
  return (
    <div className="rollback-handler">
      {/* The component just provides the rollback functionality to its parent */}
      {/* It doesn't render anything on its own */}
    </div>
  );
};
