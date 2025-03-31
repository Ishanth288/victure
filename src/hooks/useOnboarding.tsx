
import { useState, useEffect } from 'react';
import { stableToast } from '@/components/ui/stable-toast';

interface OnboardingState {
  isFirstVisit: boolean;
  hasCompletedOnboarding: boolean;
  currentStep: number;
  showOnboarding: boolean;
}

export function useOnboarding() {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    isFirstVisit: true,
    hasCompletedOnboarding: false,
    currentStep: 0,
    showOnboarding: false,
  });

  useEffect(() => {
    // Check localStorage for onboarding status
    const onboardingData = localStorage.getItem('victure-onboarding-status');
    
    if (onboardingData) {
      const parsedData = JSON.parse(onboardingData);
      setOnboardingState({
        isFirstVisit: false,
        hasCompletedOnboarding: parsedData.hasCompleted || false,
        currentStep: parsedData.lastStep || 0,
        showOnboarding: parsedData.showAgain !== false && !parsedData.hasCompleted,
      });
    } else {
      // First visit - show onboarding after a short delay
      const timer = setTimeout(() => {
        setOnboardingState(prev => ({
          ...prev,
          showOnboarding: true,
        }));
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const startOnboarding = () => {
    setOnboardingState(prev => ({
      ...prev,
      showOnboarding: true,
      currentStep: 0,
    }));
  };

  const completeOnboarding = () => {
    setOnboardingState(prev => ({
      ...prev,
      hasCompletedOnboarding: true,
      showOnboarding: false,
    }));
    
    localStorage.setItem('victure-onboarding-status', JSON.stringify({
      hasCompleted: true,
      lastStep: 999, // Completed
      showAgain: false,
    }));
    
    stableToast({
      title: "Onboarding completed!",
      description: "You're all set to explore Victure PharmEase.",
      variant: "success",
    });
  };

  const skipOnboarding = () => {
    setOnboardingState(prev => ({
      ...prev,
      showOnboarding: false,
    }));
    
    localStorage.setItem('victure-onboarding-status', JSON.stringify({
      hasCompleted: false,
      lastStep: 0,
      showAgain: false,
    }));
  };

  const setCurrentStep = (step: number) => {
    setOnboardingState(prev => ({
      ...prev,
      currentStep: step,
    }));
    
    localStorage.setItem('victure-onboarding-status', JSON.stringify({
      hasCompleted: false,
      lastStep: step,
      showAgain: true,
    }));
  };

  const closeOnboarding = () => {
    setOnboardingState(prev => ({
      ...prev,
      showOnboarding: false,
    }));
  };

  // Add setIsOpen function that was missing
  const setIsOpen = (isOpen: boolean) => {
    setOnboardingState(prev => ({
      ...prev,
      showOnboarding: isOpen,
    }));
  };

  return {
    isFirstVisit: onboardingState.isFirstVisit,
    hasCompletedOnboarding: onboardingState.hasCompletedOnboarding,
    currentStep: onboardingState.currentStep,
    showOnboarding: onboardingState.showOnboarding,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    setCurrentStep,
    closeOnboarding,
    setIsOpen, // Export the new function
  };
}
