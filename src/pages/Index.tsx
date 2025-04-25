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
import {
  setupPageOptimizations,
  deferNonCriticalResources,
  createVisibilityObserver,
} from "@/utils/performanceUtils";
import { Fallback } from "@/components/ui/fallback";
import { OnboardingProvider } from "@/components/onboarding";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Contact, Mail, Link as LinkIcon } from "lucide-react";

const Index = memo(() => {
  const feedbackSectionRef = useRef<HTMLElement>(null);
  const [isError, setIsError] = useState(false);

  const {
    showOnboarding,
    setIsOpen: setShowOnboarding,
    completeOnboarding,
    skipOnboarding,
  } = useOnboarding();

  useEffect(() => {
    const cleanupOptimizations = setupPageOptimizations();

    const observer = createVisibilityObserver((isVisible) => {
      if (isVisible) {
        deferNonCriticalResources();
      }
    });

    const sections = document.querySelectorAll(".content-visibility-auto");
    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      cleanupOptimizations();
      observer.disconnect();
    };
  }, []);

  const handleError = (error: Error) => {
    console.error("Component failed to load:", error);
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

            {/* 🔥 Cool Flash Card Before About Us Section */}
            <section className="relative z-20 py-20 px-4 sm:px-8 lg:px-20 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
              <div className="max-w-4xl mx-auto backdrop-blur-sm border border-white/10 rounded-xl p-10 bg-white/10 shadow-2xl">
                <h2 className="text-4xl font-bold text-white text-center mb-4 tracking-tight">
                  Ishanth 🚀
                </h2>
                <p className="text-center text-teal-300 text-lg mb-1">
                  GD Goenka University
                </p>
                <p className="text-center text-gray-100 mb-4 text-xl font-medium">
                  Victure - AI-powered Pharmacy Management System
                </p>
                <p className="text-center text-gray-300 text-sm mb-6">
                  A clean portfolio project blending full-stack dev, AI smarts, and SaaS experience. Made with 💙 for healthcare tech innovation.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href="mailto:ishanth28.28@gmail.com"
                    className="text-sm px-5 py-2 bg-teal-500 text-white rounded-full shadow-md hover:bg-teal-600 transition"
                  >
                    📧 ishanth28.28@gmail.com
                  </a>
                  <a
                    href="https://github.com/Ishanth288"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-5 py-2 bg-gray-900 text-white rounded-full shadow-md hover:bg-gray-800 transition"
                  >
                    💻 GitHub Repository
                  </a>
                </div>
              </div>
            </section>

            <MainContentWrapper onError={handleError} className="-mt-24">
              <ContentSection />
            </MainContentWrapper>

            <section id="portfolio" className="py-16 bg-gray-50 text-center">
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

Index.displayName = "Index";
export default Index;

