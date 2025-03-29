
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { AnimatedGradientBorder } from "@/components/ui/animated-gradient-border";
import { CardTilt } from "@/components/ui/card-tilt";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Database, Stethoscope, Rocket, BellRing, Clock, Shield, TrendingUp, BarChart, DollarSign } from "lucide-react";
import { memo } from "react";

// Memoize the component to prevent unnecessary re-renders
export const ScrollAnimationSection = memo(() => {
  return (
    <ContainerScroll
      titleComponent={
        <>
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mt-2 mb-4">
            Modern Pharmacy Management
          </h2>
          <p className="text-xl md:text-[2.5rem] font-bold text-primary leading-tight">
            AI-Powered Operations at Your Fingertips
          </p>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 h-full items-center">
        <div className="flex flex-col space-y-4">
          {[
            {
              title: "Inventory Management",
              description: "Track stock levels, manage cost and selling prices, and automate reordering with our intelligent inventory system.",
              icon: <Database className="h-6 w-6" />
            },
            {
              title: "Patient Care",
              description: "Store patient records securely and access medication histories instantly for better care.",
              icon: <Stethoscope className="h-6 w-6" />
            },
            {
              title: "Real-Time Profit Analytics",
              description: "Monitor profit margins with real-time calculations based on cost price and selling price for every product sold.",
              icon: <BarChart className="h-6 w-6" />
            }
          ].map((item, index) => (
            <ScrollReveal 
              key={index}
              animation="slide-right" 
              delay={index * 0.1}
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
        
        <div className="flex flex-col space-y-4">
          {[
            {
              title: "AI-Driven Optimization",
              description: "Our AI algorithms analyze your data to suggest optimized pricing strategies, inventory levels, and business decisions.",
              icon: <TrendingUp className="h-6 w-6" />
            },
            {
              title: "Price Management",
              description: "Easily track and manage cost prices and selling prices with historical tracking to monitor profitability over time.",
              icon: <DollarSign className="h-6 w-6" />
            },
            {
              title: "Secure Access",
              description: "Role-based access control ensures that staff members can only access the information they need.",
              icon: <Shield className="h-6 w-6" />
            }
          ].map((item, index) => (
            <ScrollReveal 
              key={index}
              animation="fade" 
              delay={index * 0.1}
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
      </div>
    </ContainerScroll>
  );
});

ScrollAnimationSection.displayName = 'ScrollAnimationSection';
