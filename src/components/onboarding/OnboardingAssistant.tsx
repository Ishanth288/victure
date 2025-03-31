
import { useState, useEffect } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { stableToast } from '@/components/ui/stable-toast';

interface Step {
  id: number;
  title: string;
  description: string;
  action?: () => void;
  skipable?: boolean;
}

interface OnboardingAssistantProps {
  steps: Step[];
  onComplete: () => void;
  onSkip?: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function OnboardingAssistant({ 
  steps, 
  onComplete, 
  onSkip, 
  isOpen, 
  setIsOpen 
}: OnboardingAssistantProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Calculate progress percentage
    setProgress((currentStep / (steps.length - 1)) * 100);
  }, [currentStep, steps.length]);

  const handleNext = () => {
    if (steps[currentStep].action) {
      steps[currentStep].action!();
    }

    setIsAnimating(true);
    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleComplete();
      }
      setIsAnimating(false);
    }, 300);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    stableToast({ 
      title: "Onboarding complete!", 
      description: "You're all set to use Victure PharmEase.",
      variant: "success",
      duration: 5000
    });
    onComplete();
  };

  const handleSkip = () => {
    setIsOpen(false);
    if (onSkip) onSkip();
    stableToast({ 
      title: "Onboarding skipped", 
      description: "You can restart the onboarding from settings anytime.",
      variant: "default",
      duration: 3000
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={`step-${currentStep}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Victure Onboarding</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </Button>
            </div>
            
            <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
              <div 
                className="h-full bg-green-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="mb-6">
              <h4 className="text-xl font-bold mb-2">{steps[currentStep].title}</h4>
              <p className="text-gray-600">{steps[currentStep].description}</p>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                {currentStep > 0 ? (
                  <Button 
                    variant="outline" 
                    onClick={handleBack} 
                    disabled={isAnimating}
                  >
                    Back
                  </Button>
                ) : (
                  steps[currentStep].skipable && (
                    <Button 
                      variant="ghost" 
                      onClick={handleSkip}
                    >
                      Skip
                    </Button>
                  )
                )}
              </div>
              
              <Button 
                onClick={handleNext} 
                disabled={isAnimating}
                className="flex items-center gap-1"
              >
                {currentStep < steps.length - 1 ? (
                  <>Next <ArrowRight size={16} /></>
                ) : (
                  <>Complete <Check size={16} /></>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
