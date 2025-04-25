
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { FloatingIconsSection } from "@/components/sections/FloatingIconsSection";
import { ScrollAnimationSection } from "@/components/sections/ScrollAnimationSection";
import { ContentSection } from "@/components/sections/ContentSection";
import { FeedbackForm } from "@/components/FeedbackForm";
import { useEffect, memo, useRef, useState } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import * as Sentry from "@sentry/react";
import { MainContentWrapper } from "@/components/sections/MainContentWrapper";
import { setupPageOptimizations, deferNonCriticalResources, createVisibilityObserver } from "@/utils/performanceUtils";
import { Fallback } from "@/components/ui/fallback";
import { OnboardingProvider } from "@/components/onboarding";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Contact, Mail, Link as LinkIcon } from "lucide-react";

// Simplified memo wrapper to reduce re-renders
const Index = memo(() => {
  const feedbackSectionRef = useRef<HTMLElement>(null);
  const [isError, setIsError] = useState(false);
  const { 
    showOnboarding,
    setIsOpen: setShowOnboarding,
    completeOnboarding,
    skipOnboarding
  } = useOnboarding();
  
  useEffect(() => {
    // Setup minimal performance optimizations
    const cleanupOptimizations = setupPageOptimizations();
    
    // Setup visibility observer
    const observer = createVisibilityObserver((isVisible) => {
      // Load resources when sections become visible
      if (isVisible) {
        deferNonCriticalResources();
      }
    });

    // Observe main content sections
    const sections = document.querySelectorAll('.content-visibility-auto');
    sections.forEach(section => {
      observer.observe(section);
    });
    
    return () => {
      cleanupOptimizations();
      observer.disconnect();
    };
  }, []);

  // Simplified error handler
  const handleError = (error: Error) => {
    console.error('Component failed to load:', error);
    Sentry.captureException(error);
    setIsError(true);
  };

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Fallback message="Something went wrong. Please refresh the page." />
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <OnboardingProvider
        isOpen={showOnboarding}
        setIsOpen={setShowOnboarding}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      >
        <div className="min-h-screen bg-white">
          <Navigation />
          <m.main 
            className="overflow-hidden" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <HeroSection />
            
            <MainContentWrapper 
              useFallback={true} 
              onError={handleError}
              className="-mt-24" 
            >
              <FloatingIconsSection />
            </MainContentWrapper>
            
            <MainContentWrapper 
              onError={handleError}
              className="-mt-32" 
            >
              <ScrollAnimationSection />
            </MainContentWrapper>
            
            <MainContentWrapper 
              onError={handleError}
              className="-mt-24" 
            >
              <ContentSection />
            </MainContentWrapper>

            <section 
              id="portfolio" 
              className="py-16 bg-gray-50 text-center"
            >
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold mb-6 text-neutral-900">Portfolio Project</h2>
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
                  <h3 className="text-2xl font-semibold mb-4">Victure - Pharmacy Management System</h3>
                  <p className="text-neutral-600 mb-6">
                    A comprehensive AI-powered pharmacy management solution developed as a portfolio project 
                    to showcase full-stack development skills and innovative technology integration.
                  </p>
                  <div className="flex justify-center space-x-4 mb-6">
                    <a 
                      href="mailto:ishanth28.28@gmail.com" 
                      className="flex items-center text-primary hover:text-primary/80 transition-colors"
                    >
                      <Mail className="mr-2" />
                      ishanth28.28@gmail.com
                    </a>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <a 
                      href="https://github.com/your-github-profile" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:text-primary/80 transition-colors"
                    >
                      <LinkIcon className="mr-2" />
                      GitHub Profile
                    </a>
                    <a 
                      href="https://linkedin.com/in/your-linkedin-profile" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:text-primary/80 transition-colors"
                    >
                      <Contact className="mr-2" />
                      LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <section 
              id="feedback" 
              className="py-12 bg-gray-50 -mt-16 content-visibility-auto" 
              ref={feedbackSectionRef}
            >
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-8">Your Feedback Matters</h2>
                <FeedbackForm />
              </div>
            </section>
          </m.main>
          <Footer />
        </div>
      </OnboardingProvider>
    </LazyMotion>
  );
});

Index.displayName = 'Index';

export default Index;

