
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
    // Check authentication first
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // User is logged in, redirect to dashboard
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Continue to show landing page if auth check fails
      }
    };
    
    checkAuth();
    
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
  }, []);

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

              {/* Feature highlights */}
              <div className="space-y-4 mb-8">
                {[
                  { icon: <Heart className="h-5 w-5 text-red-500" />, text: "Caring for Community Health" },
                  { icon: <Activity className="h-5 w-5 text-green-500" />, text: "Real-time Health Monitoring" },
                  { icon: <Shield className="h-5 w-5 text-blue-500" />, text: "Secure & Trusted Platform" },
                  { icon: <Sparkles className="h-5 w-5 text-purple-500" />, text: "AI-Powered Insights" },
                ].map((feature, index) => (
                  <m.div 
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                    className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/50 text-left"
                  >
                    {feature.icon}
                    <span className="text-gray-700 font-medium">{feature.text}</span>
                  </m.div>
                ))}
              </div>

              {/* Trust indicators */}
              <m.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="mb-8"
              >
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 font-medium">4.9/5 Rating</span>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-bold text-orange-600">10,000+</span> Happy Pharmacies across India
                </p>
              </m.div>

              {/* CTA Buttons */}
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.6 }}
                className="space-y-4"
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

              {/* Bottom trust elements */}
              <m.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.6 }}
                className="mt-8 pt-6 border-t border-gray-200"
              >
                <div className="flex justify-center items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-1 text-green-500" />
                    <span>SSL Secured</span>
                  </div>
                  <div className="h-4 w-px bg-gray-300" />
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 mr-1 text-red-500" />
                    <span>Made in India</span>
                  </div>
                </div>
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
          {/* Enhanced Background with Indian-inspired patterns */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Subtle Indian pattern overlay */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
            
            {/* Floating cultural elements - simplified */}
            <m.div 
              variants={floatingVariants}
              animate="animate"
              className="absolute top-32 right-10 text-orange-100 text-4xl opacity-30 hidden lg:block"
            >
              🕉️
            </m.div>
            
            <m.div 
              variants={mandalaVariants}
              animate="animate"
              className="absolute top-48 left-16 w-20 h-20 border border-rose-100 rounded-full opacity-20 hidden lg:block"
            />
            
            <m.div 
              variants={floatingVariants}
              animate="animate"
              className="absolute bottom-64 right-20 text-amber-100 text-3xl opacity-25 hidden lg:block"
            >
              🪷
            </m.div>
            
            <m.div 
              variants={mandalaVariants}
              animate="animate"
              className="absolute bottom-32 left-12 w-16 h-16 border border-orange-100 rounded-full opacity-15 hidden lg:block"
            />
          </div>

          {/* Mobile vs Desktop rendering */}
          {isMobile ? (
            <MobileHeroSection />
          ) : (
            <>
              <Navigation />
              <m.main 
                className="relative z-10" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
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

                {/* Enhanced Feedback Section with Indian-inspired design */}
                <section 
                  id="feedback" 
                  className="py-12 lg:py-16 bg-gradient-to-br from-orange-50/50 via-rose-50/50 to-amber-50/50 -mt-16 content-visibility-auto relative" 
                  ref={feedbackSectionRef}
                >
                  {/* Decorative pattern overlay */}
                  <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='0.6'%3E%3Ccircle cx='20' cy='20' r='3'/%3E%3Ccircle cx='20' cy='10' r='1'/%3E%3Ccircle cx='20' cy='30' r='1'/%3E%3Ccircle cx='10' cy='20' r='1'/%3E%3Ccircle cx='30' cy='20' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }} />
                  
                  <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <m.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      viewport={{ once: true }}
                      className="text-center mb-8 lg:mb-12"
                    >
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
                        Your Feedback{" "}
                        <span className="text-transparent bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text">
                          Matters
                        </span>
                      </h2>
                      <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Help us serve the healthcare community better with your valuable insights
                      </p>
                    </m.div>
                    
                    <m.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      viewport={{ once: true }}
                      className="max-w-4xl mx-auto"
                    >
                      <FeedbackForm />
                    </m.div>
                  </div>
                  
                  {/* Bottom decorative elements */}
                  <m.div 
                    variants={floatingVariants}
                    animate="animate"
                    className="absolute bottom-4 left-4 text-orange-200/50 text-xl opacity-30 hidden lg:block"
                  >
                    ✨
                  </m.div>
                  
                  <m.div 
                    variants={floatingVariants}
                    animate="animate"
                    className="absolute bottom-8 right-8 text-rose-200/50 text-lg opacity-25 hidden lg:block"
                  >
                    🌸
                  </m.div>
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
