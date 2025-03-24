
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { FloatingIconsSection } from "@/components/sections/FloatingIconsSection";
import { ScrollAnimationSection } from "@/components/sections/ScrollAnimationSection";
import { ContentSection } from "@/components/sections/ContentSection";
import { Suspense, lazy } from "react";
import { motion, LazyMotion, domAnimation } from "framer-motion";

const Spotlight = lazy(() => import("@/components/ui/spotlight").then(mod => ({ default: mod.Spotlight })));

const Index = () => {
  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-white">
        <Navigation />
        <main>
          <HeroSection />
          <FloatingIconsSection />
          <ScrollAnimationSection />
          <ContentSection />
        </main>
        <Footer />
      </div>
    </LazyMotion>
  );
};

export default Index;
