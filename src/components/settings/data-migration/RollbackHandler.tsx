
import React from 'react';

interface RollbackHandlerProps {
  isRollingBack: boolean;
  handleRollback: (migrationId: string, type: 'Inventory' | 'Patients' | 'Prescriptions') => Promise<void>;
}

export const RollbackHandler: React.FC<RollbackHandlerProps> = ({ 
  isRollingBack,
  handleRollback
}) => {
  return { isRollingBack, handleRollback };
};
