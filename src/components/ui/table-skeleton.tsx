
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
  showHeader?: boolean;
  cellClassName?: string;
  headerClassName?: string;
}

export function TableSkeleton({ 
  columns = 5, 
  rows = 5, 
  className = "",
  showHeader = true,
  cellClassName = "",
  headerClassName = ""
}: TableSkeletonProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => (
                <TableHead key={`header-${index}`} className={headerClassName}>
                  <Skeleton className="h-6 w-full max-w-[120px]" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={`row-${rowIndex}`}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={`cell-${rowIndex}-${colIndex}`} className={cellClassName}>
                  <Skeleton className={cn("h-4 w-full", colIndex === 0 ? "w-[80px]" : "")} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function CardSkeleton({ 
  count = 3, 
  className = "" 
}: { 
  count?: number; 
  className?: string; 
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={`card-skeleton-${index}`}
          className="border rounded-lg p-4 animate-pulse"
        >
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-md mb-4 w-2/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 dark:bg-gray-800/50 rounded-md"></div>
            <div className="h-4 bg-gray-100 dark:bg-gray-800/50 rounded-md w-5/6"></div>
            <div className="h-4 bg-gray-100 dark:bg-gray-800/50 rounded-md w-4/6"></div>
          </div>
          <div className="mt-4 flex justify-end">
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
