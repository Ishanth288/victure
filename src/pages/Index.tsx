
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { FloatingIconsSection } from "@/components/sections/FloatingIconsSection";
import { ScrollAnimationSection } from "@/components/sections/ScrollAnimationSection";
import { ContentSection } from "@/components/sections/ContentSection";
import { FeedbackForm } from "@/components/FeedbackForm";
import { Suspense, lazy, useEffect, memo } from "react";
import { LazyMotion, domAnimation } from "framer-motion";
import * as Sentry from "@sentry/react";
import { Fallback } from "@/components/ui/fallback";

const isHoverSupported = () => {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: hover)').matches;
};

const shouldReduceAnimation = () => {
  return typeof window !== 'undefined' && (window.innerWidth < 768 || !isHoverSupported());
};

const LoadingPlaceholder = memo(() => (
  <div className="h-60 bg-neutral-50 flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center">
      <div className="h-8 w-24 bg-neutral-200 rounded mb-4"></div>
      <div className="h-4 w-64 bg-neutral-200 rounded"></div>
    </div>
  </div>
));

LoadingPlaceholder.displayName = 'LoadingPlaceholder';

const Index = memo(() => {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('scroll', () => {}, { passive: true });

      if (!shouldReduceAnimation()) {
        const linkEl = document.createElement('link');
        linkEl.rel = 'preconnect';
        linkEl.href = 'https://prod.spline.design';
        document.head.appendChild(linkEl);

        const preloadLinks = [
          { href: '/og-image.png', as: 'image' }
        ];
        
        preloadLinks.forEach(link => {
          const preloadLink = document.createElement('link');
          preloadLink.rel = 'preload';
          preloadLink.href = link.href;
          preloadLink.as = link.as;
          document.head.appendChild(preloadLink);
        });

        document.documentElement.classList.add('gpu-accelerated');
      }

      return () => {
        document.removeEventListener('scroll', () => {});
        document.documentElement.classList.remove('gpu-accelerated');
      };
    }
  }, []);

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="overflow-hidden content-visibility-auto">
          <HeroSection />
          
          <Suspense fallback={<Fallback />}>
            <FloatingIconsSection />
          </Suspense>
          
          <Suspense fallback={<LoadingPlaceholder />}>
            <ScrollAnimationSection />
          </Suspense>
          
          <Suspense fallback={<LoadingPlaceholder />}>
            <ContentSection />
          </Suspense>

          <section id="feedback" className="py-12 bg-gray-50">
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
