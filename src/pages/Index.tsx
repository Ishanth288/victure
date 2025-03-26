
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { FloatingIconsSection } from "@/components/sections/FloatingIconsSection";
import { ScrollAnimationSection } from "@/components/sections/ScrollAnimationSection";
import { ContentSection } from "@/components/sections/ContentSection";
import { Suspense, lazy, useEffect } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";

// Helper function to detect if the browser supports hover
const isHoverSupported = () => {
  return window.matchMedia('(hover: hover)').matches;
};

// Skip animations on mobile to improve performance
const shouldReduceAnimation = () => {
  return window.innerWidth < 768 || !isHoverSupported();
};

const Index = () => {
  // Add intersection observer to load sections lazily
  useEffect(() => {
    // Pre-connect to the Spline CDN to improve loading time
    const linkEl = document.createElement('link');
    linkEl.rel = 'preconnect';
    linkEl.href = 'https://prod.spline.design';
    document.head.appendChild(linkEl);

    // Enable hardware acceleration for smoother scrolling
    document.documentElement.style.transform = 'translateZ(0)';
    document.documentElement.style.backfaceVisibility = 'hidden';

    return () => {
      document.head.removeChild(linkEl);
      document.documentElement.style.transform = '';
      document.documentElement.style.backfaceVisibility = '';
    };
  }, []);

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="overflow-hidden">
          <HeroSection />
          <FloatingIconsSection />
          <Suspense fallback={<div className="h-[60rem] bg-neutral-50 flex items-center justify-center">Loading...</div>}>
            <ScrollAnimationSection />
          </Suspense>
          <Suspense fallback={<div className="min-h-screen bg-white"></div>}>
            <ContentSection />
          </Suspense>
        </main>
        <Footer />
      </div>
    </LazyMotion>
  );
};

export default Index;
