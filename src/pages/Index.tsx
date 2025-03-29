
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
import { setupPageOptimizations } from "@/utils/performanceUtils";
import { Fallback } from "@/components/ui/fallback";

const Index = memo(() => {
  const feedbackSectionRef = useRef<HTMLElement>(null);
  const [isError, setIsError] = useState(false);
  
  useEffect(() => {
    const cleanupOptimizations = setupPageOptimizations();
    
    // Add specific optimizations for the feedback section
    if (feedbackSectionRef.current) {
      feedbackSectionRef.current.classList.add('gpu-accelerated', 'optimize-scroll');
    }
    
    return () => {
      cleanupOptimizations();
      if (feedbackSectionRef.current) {
        feedbackSectionRef.current.classList.remove('gpu-accelerated', 'optimize-scroll');
      }
    };
  }, []);

  // Error handler for Suspense/lazy components
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
          transition={{ duration: 0.3 }}
        >
          <HeroSection />
          
          <MainContentWrapper 
            useFallback={true} 
            onError={handleError}
            className="-mt-16" // Reduce gap between Hero and FloatingIcons
          >
            <FloatingIconsSection />
          </MainContentWrapper>
          
          <MainContentWrapper 
            onError={handleError}
            className="-mt-20" // Reduce gap between FloatingIcons and ScrollAnimation
          >
            <ScrollAnimationSection />
          </MainContentWrapper>
          
          <MainContentWrapper 
            onError={handleError}
            className="-mt-16" // Reduce gap between ScrollAnimation and ContentSection
          >
            <ContentSection />
          </MainContentWrapper>

          <section 
            id="feedback" 
            className="py-12 bg-gray-50 gpu-accelerated optimize-layout -mt-16" // Reduce gap to the feedback section
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
