'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { domAnimation, LazyMotion, m } from 'framer-motion';
import * as Sentry from '@sentry/nextjs';

import { useOnboarding } from '@/hooks/use-onboarding';
import { createVisibilityObserver } from '@/lib/visibility-observer';
import { deferNonCriticalResources, setupPageOptimizations } from '@/lib/optimizations';

import { Navigation } from '@/components/navigation';
import { OnboardingProvider } from '@/components/onboarding/onboarding-provider';
import { FloatingIconsSection } from '@/components/sections/floating-icons';
import { ScrollAnimationSection } from '@/components/sections/scroll-animation';
import { ContentSection } from '@/components/sections/content';
import { Footer } from '@/components/footer';
import { HeroSection } from '@/components/sections/hero';
import { FeedbackForm } from '@/components/forms/feedback';
import { MainContentWrapper } from '@/components/wrappers/main-content-wrapper';
import { Fallback } from '@/components/fallback';

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
            <HeroSection />
            <MainContentWrapper useFallback={true} onError={handleError} className="-mt-24">
              <FloatingIconsSection />
            </MainContentWrapper>
            <MainContentWrapper onError={handleError} className="-mt-32">
              <ScrollAnimationSection />
            </MainContentWrapper>

            {/* 🔥 Custom Flash Card Section */}
            <section className="relative z-10 py-16 px-4 sm:px-8 lg:px-20 flex justify-center bg-white">
              <div className="max-w-3xl w-full glass-card backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8 bg-white/10 bg-opacity-20">
                <h2 className="text-3xl font-semibold text-white text-center mb-2 tracking-tight">
                  Ishanth
                </h2>
                <p className="text-center text-teal-200 mb-1">GD Goenka University</p>
                <p className="text-center text-white text-lg mb-4">
                  Victure - AI-powered Pharmacy Management System
                </p>
                <p className="text-center text-gray-200 text-sm mb-6">
                  Built with love and innovation to showcase my full-stack dev journey into AI, healthcare tech, and SaaS architecture. A portfolio project that blends design, AI smarts, and practical functionality.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href="mailto:ishanth28.28@gmail.com"
                    className="text-sm px-4 py-2 bg-teal-500 text-white rounded-md shadow hover:bg-teal-600 transition"
                  >
                    📧 ishanth28.28@gmail.com
                  </a>
                  <a
                    href="https://github.com/Ishanth288"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-4 py-2 bg-gray-800 text-white rounded-md shadow hover:bg-gray-900 transition"
                  >
                    💻 GitHub Repository
                  </a>
                </div>
              </div>
            </section>

            {/* 👇 Normal sections continue */}
            <MainContentWrapper onError={handleError} className="-mt-24">
              <ContentSection />
            </MainContentWrapper>

            <section id="feedback" className="py-12 bg-gray-50 -mt-16 content-visibility-auto" ref={feedbackSectionRef}>
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

