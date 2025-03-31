import { useState } from 'react';
import { OnboardingAssistant } from './OnboardingAssistant';
import { DeviceCompatibilityChecker } from './DeviceCompatibilityChecker';
import { InstallationSimulator } from './InstallationSimulator';
import { stableToast } from '@/components/ui/stable-toast';

interface OnboardingProviderProps {
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingProvider({ 
  children, 
  isOpen, 
  setIsOpen,
  onComplete,
  onSkip
}: OnboardingProviderProps) {
  const [activeView, setActiveView] = useState<'assistant' | 'compatibility' | 'simulator'>('assistant');
  const [compatibilityResults, setCompatibilityResults] = useState<any>(null);
  
  const handleCompatibilityComplete = (results: any) => {
    setCompatibilityResults(results);
    
    // Check if there are any compatibility issues
    const hasIssues = !results.camera || !results.microphone || !results.connectivity;
    
    if (hasIssues) {
      stableToast({
        title: "Compatibility issues detected",
        description: "Some features may not work properly on your device.",
        variant: "warning",
      });
    }
    
    setActiveView('simulator');
  };
  
  const onboardingSteps = [
    {
      id: 1,
      title: "Welcome to Victure PharmEase",
      description: "Let's get you set up with our advanced pharmacy management solution. This will only take a few minutes.",
      skipable: true,
    },
    {
      id: 2,
      title: "Check Device Compatibility",
      description: "We'll check if your device meets the requirements for the best experience.",
      action: () => {
        setIsOpen(false);
        setActiveView('compatibility');
      },
    },
    {
      id: 3,
      title: "Key Features",
      description: "Victure PharmEase offers inventory management, prescription tracking, billing, and business optimization tools.",
    },
    {
      id: 4,
      title: "Getting Support",
      description: "If you need help, you can access our documentation or contact support through the Help section.",
    },
    {
      id: 5,
      title: "You're Ready!",
      description: "You're all set to start using Victure PharmEase. Let's get started!",
    },
  ];

  const renderView = () => {
    switch (activeView) {
      case 'compatibility':
        return (
          <DeviceCompatibilityChecker 
            onComplete={handleCompatibilityComplete}
            onCancel={() => {
              setActiveView('assistant');
              setIsOpen(true);
            }}
          />
        );
      case 'simulator':
        return (
          <InstallationSimulator 
            onComplete={() => {
              setActiveView('assistant');
              setIsOpen(true);
            }}
            onBack={() => {
              setActiveView('compatibility');
            }}
          />
        );
      case 'assistant':
      default:
        return (
          <OnboardingAssistant 
            steps={onboardingSteps}
            onComplete={onComplete}
            onSkip={onSkip}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
          />
        );
    }
  };
  
  return (
    <>
      {renderView()}
      {children}
    </>
  );
}
