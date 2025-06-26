import React from 'react';
import { cn } from '@/lib/utils';

interface ModernLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'dots';
  className?: string;
}

const ModernLoading: React.FC<ModernLoadingProps> = ({
  message = 'Loading...',
  size = 'md',
  variant = 'default',
  className
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const containerSizeClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4'
  };

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center justify-center', containerSizeClasses[size], className)}>
        <div className={cn(
          'animate-spin rounded-full border-2 border-gray-200 border-t-blue-600',
          sizeClasses[size]
        )} />
        {message && (
          <span className="text-gray-600 font-medium animate-pulse">
            {message}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded-full bg-blue-600 animate-bounce',
                size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
              )}
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.6s'
              }}
            />
          ))}
        </div>
        {message && (
          <p className="text-gray-600 font-medium text-center animate-pulse">
            {message}
          </p>
        )}
      </div>
    );
  }

  // Default variant with gradient background
  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50',
      className
    )}>
      <div className="text-center space-y-6 p-8">
        {/* Main spinner */}
        <div className="relative mx-auto">
          <div className={cn(
            'animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 border-r-blue-500 border-b-blue-400',
            sizeClasses[size]
          )} />
          {/* Inner pulse effect */}
          <div className={cn(
            'absolute inset-2 rounded-full bg-blue-100 animate-pulse opacity-30',
            size === 'sm' ? 'inset-1' : size === 'md' ? 'inset-2' : 'inset-3'
          )} />
        </div>
        
        {/* Message with typing effect */}
        {message && (
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-800 animate-pulse">
              {message}
            </h3>
            <div className="flex justify-center space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Progress bar */}
        <div className="w-64 mx-auto">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse" 
                 style={{
                   animation: 'loading-progress 2s ease-in-out infinite'
                 }} />
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes loading-progress {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
        `
      }} />
    </div>
  );
};

export default ModernLoading;