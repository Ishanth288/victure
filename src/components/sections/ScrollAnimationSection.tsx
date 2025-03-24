
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { AnimatedGradientBorder } from "@/components/ui/animated-gradient-border";
import { CardTilt } from "@/components/ui/card-tilt";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Database, Stethoscope, Rocket } from "lucide-react";

export const ScrollAnimationSection = () => {
  return (
    <ContainerScroll
      titleComponent={
        <>
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
  );
};
