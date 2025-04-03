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
// import { OnboardingProvider } from "@/components/onboarding"; // <-- Commented out import
// import { useOnboarding } from "@/hooks/useOnboarding"; // <-- Commented out import

// Simplified memo wrapper to reduce re-renders
const Index = memo(() => {
  const feedbackSectionRef = useRef<HTMLElement>(null);
  const [isError, setIsError] = useState(false);
  /* ---- Step 6: Commented out Onboarding hook usage ---- */
  /*
  const {
    showOnboarding,
    setIsOpen: setShowOnboarding,
    completeOnboarding,
    skipOnboarding
  } = useOnboarding();
  */

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
      {/* ---- Step 6: Commented out OnboardingProvider wrapper ---- */}
      {/*
      <OnboardingProvider
        // isOpen={showOnboarding} // Would cause error
        // setIsOpen={setShowOnboarding} // Would cause error
        // onComplete={completeOnboarding} // Would cause error
        // onSkip={skipOnboarding} // Would cause error
      >
      */}
        <div className="min-h-screen bg-white">
          <Navigation />
          <m.main
            className="overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }} // Faster transition
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

             <section /* ---- Step 6: Restored FeedbackForm Section ---- */
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
      {/* </OnboardingProvider> */}
      {/* ---- Step 6: Commented out OnboardingProvider wrapper ---- */}
    </LazyMotion>
  );
});

Index.displayName = 'Index';

export default Index;