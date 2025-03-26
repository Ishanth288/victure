
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { FloatingIconsSection } from "@/components/sections/FloatingIconsSection";
import { ScrollAnimationSection } from "@/components/sections/ScrollAnimationSection";
import { ContentSection } from "@/components/sections/ContentSection";
import { Suspense, lazy, useEffect, useState } from "react";
import { LazyMotion, domAnimation } from "framer-motion";

const Index = () => {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
  
  // Run this effect only once on component mount
  useEffect(() => {
    // Check if we should reduce animations
    const checkReduceMotion = () => {
      return (
        window.innerWidth < 768 || 
        !window.matchMedia('(hover: hover)').matches ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    };
    
    setShouldReduceMotion(checkReduceMotion());
    
    // Optimize performance by doing preloading and connection optimization
    const optimizePerformance = () => {
      // Pre-connect to the Spline CDN to improve loading time
      const linkEl = document.createElement('link');
      linkEl.rel = 'preconnect';
      linkEl.href = 'https://prod.spline.design';
      document.head.appendChild(linkEl);
      
      // Add passive event listeners for better scroll performance
      document.addEventListener('touchstart', () => {}, { passive: true });
      document.addEventListener('touchmove', () => {}, { passive: true });
      
      return () => {
        document.head.removeChild(linkEl);
      };
    };
    
    const cleanup = optimizePerformance();
    
    return cleanup;
  }, []);

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="overflow-x-hidden">
          <HeroSection />
          
          {/* Conditionally render floating icons based on device capability */}
          {!shouldReduceMotion && <FloatingIconsSection />}
          
          {/* Lazy load heavy components with proper suspense fallbacks */}
          <Suspense fallback={
            <div className="h-[60rem] bg-neutral-50 flex items-center justify-center">
              <span className="text-lg text-neutral-400">Loading...</span>
            </div>
          }>
            <ScrollAnimationSection />
          </Suspense>
          
          <Suspense fallback={<div className="min-h-[50vh] bg-white"></div>}>
            <ContentSection />
          </Suspense>
        </main>
        <Footer />
      </div>
    </LazyMotion>
  );
};

export default Index;
