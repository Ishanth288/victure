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
import { Mail, Github, Link as LinkIcon } from "lucide-react";
import { CardTilt } from "@/components/ui/card-tilt";
import { AnimatedGradientBorder } from "@/components/ui/animated-gradient-border";

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
    const cleanupOptimizations = setupPageOptimizations();
    const observer = createVisibilityObserver((isVisible) => {
      if (isVisible) {
        deferNonCriticalResources();
      }
    });

    const sections = document.querySelectorAll('.content-visibility-auto');
    sections.forEach(section => {
      observer.observe(section);
    });

    return () => {
      cleanupOptimizations();
      observer.disconnect();
    };
  }, []);

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
            <section className="py-12 bg-gray-50">
              <div className="container mx-auto px-4">
                <AnimatedGradientBorder className="max-w-3xl mx-auto">
                  <CardTilt className="bg-white p-8">
                    <div className="text-center space-y-4">
                      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                        Ishanth
                      </h1>
                      <p className="text-xl text-neutral-600 font-medium">
                        GD Goenka University
                      </p>
                      <div className="max-w-2xl mx-auto">
                        <h2 className="text-2xl font-semibold mb-4 text-neutral-800">Victure - Pharmacy Management System</h2>
                        <p className="text-neutral-600 mb-6">
                          A comprehensive AI-powered pharmacy management solution developed as a portfolio project 
                          to showcase full-stack development skills and innovative technology integration.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                          <a 
                            href="mailto:ishanth28.28@gmail.com" 
                            className="flex items-center text-primary hover:text-primary/80 transition-colors bg-primary/5 px-4 py-2 rounded-lg"
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            ishanth28.28@gmail.com
                          </a>
                          <a 
                            href="https://github.com/Ishanth288/victure.git" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-primary hover:text-primary/80 transition-colors bg-primary/5 px-4 py-2 rounded-lg"
                          >
                            <Github className="mr-2 h-4 w-4" />
                            GitHub Repository
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardTilt>
                </AnimatedGradientBorder>
              </div>
            </section>

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
