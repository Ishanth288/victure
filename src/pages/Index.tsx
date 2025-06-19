
import React from "react";
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
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flower, Heart, Shield, Activity, Sparkles, Star, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO/index.tsx";
import { supabase } from "@/integrations/supabase/client";

// Simplified memo wrapper to reduce re-renders
const IndexComponent = () => {
  const feedbackSectionRef = useRef<HTMLElement>(null);
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();
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
  }, [navigate]);

  // Simplified error handler
  const handleError = (error: Error) => {
    console.error('Component failed to load:', error);
    Sentry.captureException(error);
    setIsError(true);
  };

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
        <SEO 
          title="Error - Victure"
          description="Something went wrong loading Victure pharmacy management system."
          canonicalUrl="https://victure.app"
        />
        <Fallback message="Something went wrong. Please refresh the page." />
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <SEO
        title="Victure - AI-Powered Pharmacy Management for Indian Clinics"
        description="Transform your pharmacy with Victure's AI-driven platform. Real-time analytics, smart inventory, and profit tracking for clinics in India."
        canonicalUrl="https://www.victure.in/"
      />
      <OnboardingProvider
        isOpen={showOnboarding}
        setIsOpen={setShowOnboarding}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      >
        <div className="min-h-screen bg-white">
          <Navigation />
          <m.main className="relative z-10">
            <HeroSection />
            <MainContentWrapper onError={handleError}>
              <FloatingIconsSection />
            </MainContentWrapper>
            <MainContentWrapper onError={handleError}>
              <ScrollAnimationSection />
            </MainContentWrapper>
            <MainContentWrapper onError={handleError}>
              <ContentSection />
            </MainContentWrapper>
            <section id="feedback" className="py-12">
              <div className="container mx-auto px-4">
                <FeedbackForm />
              </div>
            </section>
          </m.main>
          <Footer />
        </div>
      </OnboardingProvider>
    </LazyMotion>
  );
};

const Index = memo(IndexComponent);
Index.displayName = 'Index';

export default Index;
