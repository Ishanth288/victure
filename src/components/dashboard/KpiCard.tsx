import React from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // Assuming you have a Skeleton component

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  isLoading: boolean;
  description?: string; // Optional description or comparison
  icon?: React.ReactNode; // Optional icon
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, unit, isLoading, description, icon }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      {
        isLoading ? (
          <>
            <Skeleton className="h-8 w-3/4 mb-1" />
            {description && <Skeleton className="h-4 w-1/2" />}
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-indigo-600">
              {unit && unit !== '%' ? `${unit} ` : ''}
              {value}
              {unit === '%' ? unit : ''}
            </p>
            {description && <p className="text-xs text-gray-500 truncate">{description}</p>}
          </>
        )
      }
    </div>
  );
};

export default KpiCard;