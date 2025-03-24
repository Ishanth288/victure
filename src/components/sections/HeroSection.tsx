
import { AuroraBackground } from "@/components/ui/aurora-background";
import { SplineScene } from "@/components/ui/splite";
import { TechParticles } from "@/components/ui/tech-particles";
import Hero from "@/components/Hero";
import { TechCard } from "@/components/ui/tech-card";
import { AnimatedGradientBorder } from "@/components/ui/animated-gradient-border";
import { TextScramble } from "@/components/ui/text-scramble";
import { TypingEffect } from "@/components/ui/typing-effect";
import { Cpu, CloudCog, Database } from "lucide-react";

export const HeroSection = () => {
  return (
    <AuroraBackground className="h-auto relative">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30 md:opacity-40">
        <SplineScene 
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="w-full h-full"
        />
      </div>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <TechParticles />
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
            
            <TechCard className="w-full md:w-auto px-6 py-3">
              <div className="flex items-center">
                <CloudCog className="text-primary mr-2" />
                <span className="text-neutral-800 font-medium">Cloud-Based</span>
              </div>
            </TechCard>
            
            <AnimatedGradientBorder className="w-full md:w-auto">
              <TechCard className="w-full md:w-auto px-6 py-3">
                <div className="flex items-center">
                  <Database className="text-primary mr-2" />
                  <span className="text-neutral-800 font-medium">Secure Storage</span>
                </div>
              </TechCard>
            </AnimatedGradientBorder>
          </div>
          
          <div className="mt-12 text-center">
            <TextScramble 
              texts={[
                "Powered by cutting-edge AI technology",
                "Secure. Reliable. Efficient.",
                "The future of pharmacy management is here",
                "Experience next-generation pharmacy tools"
              ]}
              className="text-xl font-medium text-neutral-800 mb-4"
            />
            <TypingEffect 
              text={[
                "Streamline your pharmacy operations",
                "Enhance patient care with AI",
                "Improve inventory management",
                "Analyze your business with precision"
              ]}
              className="text-xl font-medium text-neutral-800"
            />
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
};
