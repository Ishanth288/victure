
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
import { SEOHead, GoogleAnalytics, StructuredData, BreadcrumbSchema } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

// Simplified memo wrapper to reduce re-renders
const IndexComponent = () => {
  const feedbackSectionRef = useRef<HTMLElement>(null);
  const [isError, setIsError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { 
    showOnboarding,
    setIsOpen: setShowOnboarding,
    completeOnboarding,
    skipOnboarding
  } = useOnboarding();
  
  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
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
      window.removeEventListener('resize', checkMobile);
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

  // Enhanced floating animation variants for Indian-inspired elements
  const floatingVariants = {
    animate: {
      y: [-15, -25, -15],
      rotate: [0, 3, 0],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const mandalaVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 25,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  // Mobile Hero Section - Simplified without complex error boundaries
  const MobileHeroSection = () => (
    <div className="min-h-screen relative bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      {/* Beautiful background patterns */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      
      {/* Floating cultural elements for mobile - simplified */}
      <m.div 
        variants={floatingVariants}
        animate="animate"
        className="absolute top-20 right-4 text-orange-200 text-3xl opacity-25"
      >
        🕉️
      </m.div>
      
      <m.div 
        variants={mandalaVariants}
        animate="animate"
        className="absolute top-40 left-4 w-12 h-12 border border-rose-200 rounded-full opacity-20"
      />
      
      <m.div 
        variants={floatingVariants}
        animate="animate"
        className="absolute bottom-32 right-6 text-amber-200 text-2xl opacity-20"
      >
        🪷
      </m.div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Mobile Navigation */}
        <nav className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Flower className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                  Victure
                </h1>
                <p className="text-xs text-gray-600 font-medium">Healthcare Solutions</p>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex items-center px-6 py-8">
          <div className="w-full">
            <m.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Flower className="h-12 w-12 text-white" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-800 mb-4 leading-tight">
                Transforming Healthcare,
                <span className="block text-transparent bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text">
                  One Pharmacy at a Time
                </span>
              </h1>
              
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Join thousands of healthcare professionals who trust Victure to streamline their pharmacy operations with cutting-edge technology.
              </p>

              {/* CTA Buttons */}
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.6 }}
                className="space-y-4 relative z-20"
              >
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full h-14 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/auth', { state: { isLogin: true } })}
                  className="w-full h-12 border-2 border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl font-medium"
                >
                  Sign In
                </Button>
              </m.div>
            </m.div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
        <SEOHead 
          title="Error - Victure"
          description="Something went wrong loading Victure pharmacy management system."
        />
        <Fallback message="Something went wrong. Please refresh the page." />
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <SEOHead 
        title="Victure - Transform Your Pharmacy Operations with AI"
        description="Join 10,000+ pharmacies using Victure's AI-powered management system. Streamline inventory, automate billing, manage patients, and boost profits. Start your free trial today!"
        keywords="pharmacy management software, inventory tracking, prescription billing, patient records, healthcare automation, pharmacy POS system, medical inventory management, pharmacy analytics"
        pageType="home"
      />
      <GoogleAnalytics measurementId="G-XXXXXXXXXX" />
      <StructuredData type="SoftwareApplication" />
      <StructuredData type="Organization" />
      <BreadcrumbSchema />
      <OnboardingProvider
        isOpen={showOnboarding}
        setIsOpen={setShowOnboarding}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      >
        <div className="min-h-screen bg-white">
          {/* Check if mobile and render accordingly */}
          {isMobile ? (
            <MobileHeroSection />
          ) : (
            <>
              {/* Desktop version with full navigation and content */}
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
            </>
          )}
        </div>
      </OnboardingProvider>
    </LazyMotion>
  );
};

const Index = memo(IndexComponent);
Index.displayName = 'Index';

export default Index;
