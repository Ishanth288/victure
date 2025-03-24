
import { AuroraBackground } from "@/components/ui/aurora-background";
import { SplineScene } from "@/components/ui/splite";
import { TechParticles } from "@/components/ui/tech-particles";
import Hero from "@/components/Hero";
import { TechCard } from "@/components/ui/tech-card";
import { AnimatedGradientBorder } from "@/components/ui/animated-gradient-border";
import { TextScramble } from "@/components/ui/text-scramble";
import { TypingEffect } from "@/components/ui/typing-effect";
import { Cpu, CloudCog, Database, Award, ShieldCheck, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

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
          
          {/* Company Promotion - Right Side */}
          <div className="mt-16 md:absolute md:right-12 md:top-32 md:w-[300px] z-20">
            <ScrollReveal animation="slide-right" delay={0.3}>
              <AnimatedGradientBorder borderWidth={2}>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center"
                  >
                    <div className="text-3xl font-bold text-primary mb-3">Victure</div>
                    <div className="text-neutral-700 text-center mb-4">Transforming Pharmacy Management Since 2023</div>
                    
                    <div className="space-y-4 w-full">
                      <div className="flex items-center space-x-3">
                        <Award className="text-primary" />
                        <div className="text-neutral-800">Industry Leading Solution</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <ShieldCheck className="text-primary" />
                        <div className="text-neutral-800">100% Secure & Compliant</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="text-primary" />
                        <div className="text-neutral-800">Boost Efficiency by 35%</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </AnimatedGradientBorder>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
};
