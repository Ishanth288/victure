import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PackageSearch } from 'lucide-react';

interface InventoryLoadingStateProps {
  message?: string;
}

const InventoryLoadingState: React.FC<InventoryLoadingStateProps> = ({ 
  message = "Loading inventory insights..." 
}) => {
  const renderSkeletons = (count: number) => (
    Array(count).fill(0).map((_, index) => (
      <div key={index} className="bg-gray-100 p-4 rounded-lg animate-pulse">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    ))
  );

  return (
    <section className="bg-white p-6 md:p-8 rounded-xl shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
            <PackageSearch className="mr-3 h-7 w-7 text-indigo-600" />
            Intelligent Inventory Management
          </h2>
          <p className="text-gray-600 mt-1">{message}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Prescription-Driven Suggestions Skeleton */}
        <div className="bg-gray-50 p-6 rounded-lg border">
          <div className="flex items-center mb-4">
            <Skeleton className="h-6 w-6 mr-3" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-full mb-4" />
          <div className="space-y-2">
            {renderSkeletons(2)}
          </div>
        </div>

        {/* Sales Velocity Skeleton */}
        <div className="bg-gray-50 p-6 rounded-lg border">
          <div className="flex items-center mb-4">
            <Skeleton className="h-6 w-6 mr-3" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-full mb-4" />
          <div className="space-y-2">
            {renderSkeletons(2)}
          </div>
        </div>

        {/* Expiry Alerts Skeleton */}
        <div className="bg-gray-50 p-6 rounded-lg border">
          <div className="flex items-center mb-4">
            <Skeleton className="h-6 w-6 mr-3" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-full mb-4" />
          <div className="space-y-2">
            {renderSkeletons(2)}
          </div>
        </div>

        {/* Fast/Slow Movers Skeleton */}
        <div className="bg-gray-50 p-6 rounded-lg border">
          <div className="flex items-center mb-4">
            <Skeleton className="h-6 w-6 mr-3" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-full mb-4" />
          <div className="space-y-2">
            {renderSkeletons(3)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InventoryLoadingState;