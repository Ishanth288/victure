
import { AuroraBackground } from "@/components/ui/aurora-background";
import { TechParticles } from "@/components/ui/tech-particles";
import Hero from "@/components/Hero";
import { TechCard } from "@/components/ui/tech-card";
import { AnimatedGradientBorder } from "@/components/ui/animated-gradient-border";
import { TextScramble } from "@/components/ui/text-scramble";
import { TypingEffect } from "@/components/ui/typing-effect";
import { Cpu, CloudCog, Database, BarChart } from "lucide-react";
import { memo, Suspense, lazy, useState, useEffect } from "react";

// Memoize the HeroSection component to prevent unnecessary re-renders
export const HeroSection = memo(() => {
  const [shouldLoadAnimations, setShouldLoadAnimations] = useState(false);
  
  // Only load animations after the main content is visible
  useEffect(() => {
    // Delay loading animations to prioritize core content
    const timer = setTimeout(() => {
      setShouldLoadAnimations(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <AuroraBackground className="h-auto relative">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 md:opacity-30">
        {/* Replace the problematic Spline with a simple gradient background */}
        <div className="pharmacy-gradient w-full h-full rounded-xl opacity-30" />
      </div>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <TechParticles count={window.innerWidth < 768 ? 15 : 30} />
      </div>
      <div className="relative z-10">
        <Hero />
        <div className="container mx-auto px-4 pb-8">
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <AnimatedGradientBorder className="w-full md:w-auto">
              <TechCard className="w-full md:w-auto px-6 py-3">
                <div className="flex items-center">
                  <Cpu className="text-primary mr-2" />
                  <span className="text-neutral-800 font-medium">AI-Powered</span>
                </div>
              </TechCard>
            </AnimatedGradientBorder>
            
            <AnimatedGradientBorder className="w-full md:w-auto">
              <TechCard className="w-full md:w-auto px-6 py-3">
                <div className="flex items-center">
                  <CloudCog className="text-primary mr-2" />
                  <span className="text-neutral-800 font-medium">Cloud-Based</span>
                </div>
              </TechCard>
            </AnimatedGradientBorder>
            
            <AnimatedGradientBorder className="w-full md:w-auto">
              <TechCard className="w-full md:w-auto px-6 py-3">
                <div className="flex items-center">
                  <Database className="text-primary mr-2" />
                  <span className="text-neutral-800 font-medium">Secure Storage</span>
                </div>
              </TechCard>
            </AnimatedGradientBorder>

            <AnimatedGradientBorder className="w-full md:w-auto">
              <TechCard className="w-full md:w-auto px-6 py-3">
                <div className="flex items-center">
                  <BarChart className="text-primary mr-2" />
                  <span className="text-neutral-800 font-medium">Real-Time Analytics</span>
                </div>
              </TechCard>
            </AnimatedGradientBorder>
          </div>
          
          <div className="mt-12 text-center">
            {shouldLoadAnimations ? (
              <>
                <Suspense fallback={<p className="text-xl font-medium text-neutral-800 mb-4">Powered by cutting-edge AI technology</p>}>
                  <TextScramble 
                    texts={[
                      "Powered by cutting-edge AI technology",
                      "Real-time profit tracking and analysis",
                      "Intelligent pricing optimization",
                      "Data-driven business decisions",
                      "The future of pharmacy management is here"
                    ]}
                    className="text-xl font-medium text-neutral-800 mb-4"
                  />
                </Suspense>
                <Suspense fallback={<p className="text-xl font-medium text-neutral-800">Streamline your pharmacy operations</p>}>
                  <TypingEffect 
                    text={[
                      "Streamline your pharmacy operations",
                      "Maximize profits with AI-driven insights",
                      "Optimize inventory and pricing in real-time",
                      "Enhance patient care with smart analytics"
                    ]}
                    className="text-xl font-medium text-neutral-800"
                  />
                </Suspense>
              </>
            ) : (
              <>
                <p className="text-xl font-medium text-neutral-800 mb-4">Powered by cutting-edge AI technology</p>
                <p className="text-xl font-medium text-neutral-800">Streamline your pharmacy operations</p>
              </>
            )}
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
});

HeroSection.displayName = 'HeroSection';
