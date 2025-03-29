
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { FloatingIconsSection } from "@/components/sections/FloatingIconsSection";
import { ScrollAnimationSection } from "@/components/sections/ScrollAnimationSection";
import { ContentSection } from "@/components/sections/ContentSection";
import { FeedbackForm } from "@/components/FeedbackForm";
import { useEffect, memo, useRef } from "react";
import { LazyMotion, domAnimation } from "framer-motion";
import * as Sentry from "@sentry/react";
import { MainContentWrapper } from "@/components/sections/MainContentWrapper";
import { setupPageOptimizations } from "@/utils/performanceUtils";

const Index = memo(() => {
  const feedbackSectionRef = useRef<HTMLElement>(null);
  
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

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="overflow-hidden content-visibility-auto">
          <HeroSection />
          
          <MainContentWrapper useFallback={true}>
            <FloatingIconsSection />
          </MainContentWrapper>
          
          <MainContentWrapper>
            <ScrollAnimationSection />
          </MainContentWrapper>
          
          <MainContentWrapper>
            <ContentSection />
          </MainContentWrapper>

          <section 
            id="feedback" 
            className="py-12 bg-gray-50 optimize-layout" 
            ref={feedbackSectionRef}
          >
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-8">Your Feedback Matters</h2>
              <FeedbackForm />
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </LazyMotion>
  );
});

Index.displayName = 'Index';

export default Index;
