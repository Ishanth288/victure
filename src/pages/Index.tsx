
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

// Create loading placeholders for better UX
const LoadingPlaceholder = () => (
  <div className="h-[60rem] bg-neutral-50 flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center">
      <div className="h-8 w-24 bg-neutral-200 rounded mb-4"></div>
      <div className="h-4 w-64 bg-neutral-200 rounded"></div>
    </div>
  </div>
);

const Index = () => {
  // Add intersection observer to load sections lazily
  useEffect(() => {
    // Pre-connect to the Spline CDN to improve loading time
    const linkEl = document.createElement('link');
    linkEl.rel = 'preconnect';
    linkEl.href = 'https://prod.spline.design';
    document.head.appendChild(linkEl);

    // Add preload for critical resources
    const preloadLinks = [
      { href: '/og-image.png', as: 'image' },
      { href: 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode', as: 'fetch', crossorigin: 'anonymous' }
    ];
    
    preloadLinks.forEach(link => {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.href = link.href;
      preloadLink.as = link.as;
      if (link.crossorigin) preloadLink.crossOrigin = link.crossorigin;
      document.head.appendChild(preloadLink);
    });

    // Enable hardware acceleration for smoother scrolling
    document.documentElement.style.transform = 'translateZ(0)';
    document.documentElement.style.backfaceVisibility = 'hidden';

    return () => {
      document.head.removeChild(linkEl);
      preloadLinks.forEach((_, i) => {
        if (document.head.children[document.head.children.length - 1].tagName === 'LINK') {
          document.head.removeChild(document.head.children[document.head.children.length - 1]);
        }
      });
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
          {/* Defer non-critical sections */}
          <Suspense fallback={null}>
            <FloatingIconsSection />
          </Suspense>
          <Suspense fallback={<LoadingPlaceholder />}>
            <ScrollAnimationSection />
          </Suspense>
          <Suspense fallback={null}>
            <ContentSection />
          </Suspense>
        </main>
        <Footer />
      </div>
    </LazyMotion>
  );
};

export default Index;
