
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Benefits from "@/components/Benefits";
import Demo from "@/components/Demo";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { Pricing } from "@/components/blocks/Pricing";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { motion, LazyMotion, domAnimation } from "framer-motion";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Button } from "@/components/ui/button";
import { SplineScene } from "@/components/ui/splite";
import { Suspense, lazy } from "react";
import { TechParticles } from "@/components/ui/tech-particles";
import { TechCard } from "@/components/ui/tech-card";
import { FloatingIcon } from "@/components/ui/floating-icon";
import { TypingEffect } from "@/components/ui/typing-effect";
import { TextScramble } from "@/components/ui/text-scramble";
import { CardTilt } from "@/components/ui/card-tilt";
import { AnimatedGradientBorder } from "@/components/ui/animated-gradient-border";
import { HoverInfoCard } from "@/components/ui/hover-info-card";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Pill, PencilRuler, Rocket, Database, CloudCog, Cpu, BrainCircuit, Microscope, Leaf, Stethoscope } from "lucide-react";

const Spotlight = lazy(() => import("@/components/ui/spotlight").then(mod => ({ default: mod.Spotlight })));

const pricingPlans = [
  {
    name: "FREE",
    price: "0",
    yearlyPrice: "0",
    period: "per month",
    features: [
      "30-day trial access",
      "Limited to 501 products in inventory",
      "30 bills per day",
      "600 bills per month",
      "Basic pharmacy management",
      "Standard customer support",
    ],
    description: "Perfect for trying out the system",
    buttonText: "Get Started",
    href: "/auth?signup=true",
    isPopular: false,
  },
  {
    name: "PRO",
    price: "2,899",
    yearlyPrice: "24,299",
    period: "per month",
    planId: "pro_monthly", // Replace with your actual Razorpay plan ID
    features: [
      "Annual access",
      "Up to 4001 products in inventory",
      "1501 bills per month",
      "1501 patients per month",
      "Data storage for 1 year",
      "Access to insights page",
      "Advanced reporting",
      "Priority customer support",
    ],
    description: "Best for growing pharmacies",
    buttonText: "Upgrade Now",
    href: "#",
    isPopular: true,
  },
  {
    name: "PRO PLUS",
    price: "4,899",
    yearlyPrice: "38,999",
    period: "per month",
    planId: "pro_plus_monthly", // Replace with your actual Razorpay plan ID
    features: [
      "Everything in Pro plan",
      "Up to 10,000 products in inventory",
      "10,000 bills per month",
      "10,000 patients per month",
      "Custom website for multibranch",
      "Premium AI insights every month",
      "Dedicated account manager",
      "Custom integrations",
      "Advanced data analytics",
    ],
    description: "For large pharmacy chains with multiple locations",
    buttonText: "Upgrade Now",
    href: "#",
    isPopular: false,
  },
];

const Index = () => {
  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-white">
        <Navigation />
        <main>
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
                    className="text-xl font-medium text-primary mb-4"
                  />
                  <TypingEffect 
                    text={[
                      "Streamline your pharmacy operations",
                      "Enhance patient care with AI",
                      "Improve inventory management",
                      "Analyze your business with precision"
                    ]}
                    className="text-xl font-medium text-primary"
                  />
                </div>
                
                <div className="flex justify-center mt-8 gap-6">
                  <ProgressCircle 
                    progress={92} 
                    size={80} 
                    label={<span className="text-sm font-bold">92%</span>}
                  />
                  <ProgressCircle 
                    progress={85} 
                    size={80}
                    label={<span className="text-sm font-bold">85%</span>}
                    color="var(--secondary)"
                  />
                  <ProgressCircle 
                    progress={78} 
                    size={80}
                    label={<span className="text-sm font-bold">78%</span>}
                    color="#0F766E"
                  />
                </div>
              </div>
            </div>
          </AuroraBackground>
          
          <div className="overflow-hidden -mt-32 relative">
            <FloatingIcon 
              icon={Pill} 
              color="text-blue-500" 
              size={32} 
              className="top-20 left-[10%]" 
              delay={0.2}
            />
            <FloatingIcon 
              icon={PencilRuler} 
              color="text-indigo-500" 
              size={28} 
              className="top-40 right-[15%]" 
              delay={0.5}
            />
            <FloatingIcon 
              icon={Rocket} 
              color="text-primary" 
              size={24} 
              className="top-80 left-[25%]" 
              delay={0.8}
            />
            <FloatingIcon 
              icon={BrainCircuit} 
              color="text-secondary" 
              size={26} 
              className="top-30 right-[25%]" 
              delay={0.3}
            />
            <FloatingIcon 
              icon={Microscope} 
              color="text-primary-dark" 
              size={30} 
              className="top-60 left-[40%]" 
              delay={0.7}
            />
            <ContainerScroll
              titleComponent={
                <>
                  <span className="text-primary font-semibold">Experience</span>
                  <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mt-2 mb-4">
                    Modern Pharmacy Management
                  </h2>
                  <p className="text-xl md:text-[2.5rem] font-bold text-primary leading-tight">
                    Streamlined Operations at Your Fingertips
                  </p>
                </>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 h-full items-center">
                <div className="flex flex-col space-y-4">
                  {[
                    {
                      title: "Inventory Management",
                      description: "Track stock levels, manage expiry dates, and automate reordering with our intelligent inventory system.",
                      icon: <Database className="h-6 w-6" />
                    },
                    {
                      title: "Patient Care",
                      description: "Store patient records securely and access medication histories instantly for better care.",
                      icon: <Stethoscope className="h-6 w-6" />
                    },
                    {
                      title: "Billing & Reporting",
                      description: "Generate invoices in seconds and gain valuable insights with comprehensive analytics.",
                      icon: <Rocket className="h-6 w-6" />
                    }
                  ].map((item, index) => (
                    <ScrollReveal 
                      key={index}
                      animation="slide-right" 
                      delay={index * 0.2}
                    >
                      <CardTilt className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-start gap-4">
                          <div className="text-primary">{item.icon}</div>
                          <div>
                            <h3 className="text-xl font-bold text-primary mb-2">{item.title}</h3>
                            <p className="text-neutral-700">{item.description}</p>
                          </div>
                        </div>
                      </CardTilt>
                    </ScrollReveal>
                  ))}
                </div>
                
                <div className="hidden md:flex md:justify-center md:items-center md:h-full">
                  <AnimatedGradientBorder borderWidth={3}>
                    <div className="pharmacy-gradient w-full h-[400px] relative overflow-hidden rounded-xl shadow-xl">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white text-center p-6">
                          <h3 className="text-3xl font-bold mb-4">Victure</h3>
                          <p className="text-lg mb-6">Complete Pharmacy Management Solution</p>
                          <div className="flex justify-center space-x-4">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                            </div>
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AnimatedGradientBorder>
                </div>
              </div>
            </ContainerScroll>
          </div>
          
          <Suspense fallback={null}>
            <Features />
            <Benefits />
            <Demo />
            <div id="pricing">
              <Pricing 
                plans={pricingPlans}
                title="Choose Your Perfect Plan"
                description="Select the plan that best fits your pharmacy needs. All plans include our powerful pharmacy management features with specific usage limits for each tier."
              />
            </div>
            <CTA />
          </Suspense>
        </main>
        <Footer />
      </div>
    </LazyMotion>
  );
};

export default Index;
