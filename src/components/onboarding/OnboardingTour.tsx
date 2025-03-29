
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface TourStep {
  title: string;
  description: string;
  image?: string;
  targetElement?: string;
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to Victure",
    description: "Let's take a quick tour to help you get started with your pharmacy management system.",
    targetElement: "body",
  },
  {
    title: "Dashboard",
    description: "Your dashboard gives you an overview of your pharmacy's performance and key metrics.",
    targetElement: "[data-tour-id='dashboard']",
  },
  {
    title: "Inventory Management",
    description: "Manage your pharmacy inventory, track stock levels, and get alerts when items are running low.",
    targetElement: "[data-tour-id='inventory']",
  },
  {
    title: "Patient Management",
    description: "Keep track of all your patients and their prescription history in one place.",
    targetElement: "[data-tour-id='patients']",
  },
  {
    title: "Billing System",
    description: "Create and manage invoices, process payments, and keep track of your finances.",
    targetElement: "[data-tour-id='billing']",
  },
  {
    title: "Appointments",
    description: "Schedule and manage patient appointments with our built-in calendar system.",
    targetElement: "[data-tour-id='appointments']",
  },
  {
    title: "Reports",
    description: "Generate comprehensive reports to analyze your pharmacy's performance and make data-driven decisions.",
    targetElement: "[data-tour-id='reports']",
  },
  {
    title: "Settings",
    description: "Customize your pharmacy profile, notification preferences, and system settings.",
    targetElement: "[data-tour-id='settings']",
  },
  {
    title: "You're all set!",
    description: "You've completed the tour. Feel free to explore the system and contact support if you need any help.",
    targetElement: "body",
  }
];

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const checkOnboardingStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        // We check if the user is new by looking at other attributes
        // since onboarding_completed might not exist
        if (data && data.registration_date) {
          const registrationDate = new Date(data.registration_date);
          const daysSinceRegistration = Math.floor((Date.now() - registrationDate.getTime()) / (1000 * 3600 * 24));
          
          // Show tour for users registered in the last 3 days
          if (daysSinceRegistration <= 3) {
            setShowTour(true);
            setIsOpen(true);
          }
        }
      }
    };
    
    checkOnboardingStatus();
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      scrollToElement(tourSteps[currentStep + 1].targetElement);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollToElement(tourSteps[currentStep - 1].targetElement);
    }
  };

  const handleComplete = async () => {
    setIsOpen(false);
    
    // Mark tour as seen in local storage instead of database
    localStorage.setItem('onboarding_tour_completed', 'true');
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user?.id) {
      // Update any existing profile data that we know exists
      await supabase
        .from('profiles')
        .update({ 
          // We don't update onboarding_completed since it doesn't exist
        })
        .eq('id', session.user.id);
    }
  };

  const scrollToElement = (selector?: string) => {
    if (!selector) return;
    
    setTimeout(() => {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  };

  if (!showTour) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] pb-4">
          <DialogHeader>
            <DialogTitle>{tourSteps[currentStep].title}</DialogTitle>
            <DialogDescription className="text-base">
              {tourSteps[currentStep].description}
            </DialogDescription>
          </DialogHeader>
          
          {tourSteps[currentStep].image && (
            <div className="flex justify-center my-4">
              <img 
                src={tourSteps[currentStep].image} 
                alt={tourSteps[currentStep].title}
                className="max-w-full rounded-md shadow-md"
                style={{ maxHeight: '200px' }}
              />
            </div>
          )}
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-1">
              {tourSteps.map((_, index) => (
                <div 
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? "bg-primary" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Step {currentStep + 1} of {tourSteps.length}
            </p>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
              >
                Previous
              </Button>
            )}
            {currentStep < tourSteps.length - 1 ? (
              <Button 
                type="button" 
                onClick={handleNext}
              >
                Next
              </Button>
            ) : (
              <Button 
                type="button" 
                onClick={handleComplete}
              >
                Finish
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
