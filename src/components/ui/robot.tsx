
import React from 'react';
import { m } from 'framer-motion';

interface RobotProps {
  className?: string;
}

export const Robot: React.FC<RobotProps> = ({ className = "" }) => {
  return (
    <div className={`robot-container relative ${className}`}>
      {/* Robot Head */}
      <m.div 
        className="robot-head relative w-32 h-32 bg-white rounded-xl border-2 border-neutral-300 mx-auto shadow-lg"
        initial={{ y: -10 }}
        animate={{ y: 0 }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          repeatType: "reverse", 
          ease: "easeInOut" 
        }}
      >
        {/* Robot Eyes */}
        <div className="robot-eyes flex justify-center space-x-6 pt-6">
          <m.div 
            className="robot-eye w-4 h-6 bg-blue-500 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              backgroundColor: ['#3b82f6', '#60a5fa', '#3b82f6']
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
          <m.div 
            className="robot-eye w-4 h-6 bg-blue-500 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              backgroundColor: ['#3b82f6', '#60a5fa', '#3b82f6']
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </div>
        
        {/* Robot Mouth */}
        <div className="robot-mouth w-12 h-2 bg-neutral-200 rounded-lg mx-auto mt-6" />
        
        {/* Robot Antennas */}
        <m.div 
          className="robot-antenna absolute -top-6 left-1/2 -ml-1 w-2 h-6 bg-neutral-400"
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <div className="w-3 h-3 rounded-full bg-red-500 absolute -top-2 -left-0.5" />
        </m.div>
      </m.div>
      
      {/* Robot Body */}
      <div className="robot-body w-40 h-36 bg-indigo-100 rounded-xl border-2 border-neutral-300 mx-auto mt-2 relative overflow-hidden">
        {/* Robot Control Panel */}
        <div className="control-panel grid grid-cols-2 gap-2 p-4">
          <m.div 
            className="w-5 h-5 rounded-full bg-green-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <m.div 
            className="w-5 h-5 rounded-full bg-yellow-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
          <m.div 
            className="w-5 h-5 rounded-full bg-red-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          />
          <m.div 
            className="w-5 h-5 rounded-full bg-blue-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
          />
        </div>
        
        {/* Robot Screen */}
        <div className="robot-screen w-32 h-12 bg-neutral-800 mx-auto rounded flex items-center justify-center">
          <m.div
            className="text-xs text-green-400 font-mono"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Pharmacy AI
          </m.div>
        </div>
        
        {/* Robot Buttons */}
        <div className="robot-buttons flex justify-center space-x-2 mt-2">
          <div className="w-4 h-2 bg-neutral-300 rounded" />
          <div className="w-4 h-2 bg-neutral-300 rounded" />
          <div className="w-4 h-2 bg-neutral-300 rounded" />
        </div>
      </div>
      
      {/* Robot Arms */}
      <div className="robot-arms flex justify-between w-48 mx-auto -mt-24">
        <m.div 
          className="robot-arm w-3 h-16 bg-indigo-200 rounded-full"
          initial={{ rotate: -20 }}
          animate={{ rotate: [-15, 0, -15] }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        <m.div 
          className="robot-arm w-3 h-16 bg-indigo-200 rounded-full"
          initial={{ rotate: 20 }}
          animate={{ rotate: [15, 0, 15] }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
      </div>
    </div>
  );
};
