import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'kpi' | 'table' | 'chart' | 'dashboard' | 'form' | 'list';
  lines?: number;
  animate?: boolean;
  width?: string;
  height?: string;
  rows?: number;
  columns?: number;
  items?: number;
  fields?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  lines = 1,
  animate = true,
  width,
  height,
  rows = 5,
  columns = 4,
  items = 5,
  fields = 5
}) => {
  const baseClasses = cn(
    'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded',
    animate && 'animate-pulse',
    className
  );

  const style = {
    width: width || undefined,
    height: height || undefined,
  };

  if (variant === 'text') {
    if (lines === 1) {
      return <div className={cn(baseClasses, 'h-4 w-full')} style={style} />;
    }
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              'h-4',
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )}
            style={style}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('bg-white p-6 rounded-xl shadow-lg space-y-4', className)}>
        <div className={cn(baseClasses, 'h-6 w-1/3')} />
        <div className="space-y-2">
          <div className={cn(baseClasses, 'h-4 w-full')} />
          <div className={cn(baseClasses, 'h-4 w-5/6')} />
          <div className={cn(baseClasses, 'h-4 w-4/6')} />
        </div>
      </div>
    );
  }

  if (variant === 'avatar') {
    return <div className={cn(baseClasses, 'w-10 h-10 rounded-full')} style={style} />;
  }

  if (variant === 'button') {
    return <div className={cn(baseClasses, 'h-10 w-24')} style={style} />;
  }

  if (variant === 'kpi') {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg space-y-3">
        <div className={cn(baseClasses, 'h-4 w-1/2')} />
        <div className={cn(baseClasses, 'h-8 w-3/4')} />
        <div className={cn(baseClasses, 'h-3 w-1/3')} />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <div key={`header-${index}`} className={cn(baseClasses, 'h-6')} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={`cell-${rowIndex}-${colIndex}`} className={cn(baseClasses, 'h-8')} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return <div className={cn(baseClasses, 'h-64 w-full rounded-lg')} style={style} />;
  }

  if (variant === 'dashboard') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className={cn(baseClasses, 'h-8 w-1/3')} />
          <div className={cn(baseClasses, 'h-4 w-1/2')} />
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-2">
              <div className={cn(baseClasses, 'h-4 w-1/2')} />
              <div className={cn(baseClasses, 'h-8 w-3/4')} />
              <div className={cn(baseClasses, 'h-3 w-1/3')} />
            </div>
          ))}
        </div>
        
        {/* Chart */}
        <div className="space-y-4">
          <div className={cn(baseClasses, 'h-6 w-1/4')} />
          <div className={cn(baseClasses, 'h-64 w-full rounded-lg')} />
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: items }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
            <div className={cn(baseClasses, 'w-12 h-12 rounded-full')} />
            <div className="flex-1 space-y-2">
              <div className={cn(baseClasses, 'h-4 w-1/3')} />
              <div className={cn(baseClasses, 'h-4 w-full')} />
              <div className={cn(baseClasses, 'h-4 w-3/4')} />
            </div>
            <div className={cn(baseClasses, 'h-10 w-24')} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className="space-y-6">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className={cn(baseClasses, 'h-4 w-1/4')} />
            <div className={cn(baseClasses, 'h-10 w-full')} />
          </div>
        ))}
        <div className="flex space-x-4 pt-4">
          <div className={cn(baseClasses, 'h-10 w-24')} />
          <div className={cn(baseClasses, 'h-10 w-20')} />
        </div>
      </div>
    );
  }

  return <div className={baseClasses} style={style} />;
};

interface SkeletonGroupProps {
  count?: number;
  variant?: SkeletonProps['variant'];
  className?: string;
  containerClassName?: string;
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  count = 3,
  variant = 'text',
  className,
  containerClassName
}) => {
  return (
    <div className={cn('space-y-4', containerClassName)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant={variant} className={className} />
      ))}
    </div>
  );
};

export default Skeleton;