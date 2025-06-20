import React from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, children }) => {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-stone-100 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-3">{description}</p>
      {children && <div className="mt-auto pt-3 border-t border-gray-200">{children}</div>}
    </div>
  );
};