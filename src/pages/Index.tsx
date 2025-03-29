
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
import { setupPageOptimizations, deferNonCriticalResources } from "@/utils/performanceUtils";
import { Fallback } from "@/components/ui/fallback";

// Simplified memo wrapper to reduce re-renders
const Index = memo(() => {
  const feedbackSectionRef = useRef<HTMLElement>(null);
  const [isError, setIsError] = useState(false);
  
  useEffect(() => {
    // Setup minimal performance optimizations
    const cleanupOptimizations = setupPageOptimizations();
    
    // Defer loading of non-critical resources
    deferNonCriticalResources();
    
    return () => {
      cleanupOptimizations();
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

          <section 
            id="feedback" 
            className="py-12 bg-gray-50 -mt-16" 
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
    </LazyMotion>
  );
});

Index.displayName = 'Index';

export default Index;
