
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { CardTilt } from "@/components/ui/card-tilt";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Database, Brain, TrendingUp, BellRing, Clock, BarChart, DollarSign } from "lucide-react";
import { memo } from "react";

// Memoize the component to prevent unnecessary re-renders
export const ScrollAnimationSection = memo(() => {
  return (
    <ContainerScroll
      titleComponent={
        <>
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mt-2 mb-4">
            AI-Powered Pharmacy Management
          </h2>
          <p className="text-xl md:text-[2.5rem] font-bold text-primary leading-tight">
            Real-Time Profit Analytics at Your Fingertips
          </p>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 h-full items-center">
        <div className="flex flex-col space-y-4">
          {[
            {
              title: "Real-Time Profit Tracking",
              description: "Monitor profit margins with instant calculations based on cost price and selling price for every product you sell.",
              icon: <DollarSign className="h-6 w-6" />
            },
            {
              title: "AI-Powered Inventory Optimization",
              description: "Our machine learning algorithms analyze your sales data to suggest optimal inventory levels and reordering schedules.",
              icon: <Brain className="h-6 w-6" />
            },
            {
              title: "Live Profit Analytics Dashboard",
              description: "View comprehensive analytics on your most profitable products, times, and customer segments as transactions happen.",
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
              title: "Intelligent Pricing Optimization",
              description: "Our AI algorithms analyze your market position and competition to suggest optimal pricing strategies for maximum profitability.",
              icon: <TrendingUp className="h-6 w-6" />
            },
            {
              title: "Real-Time Profit Margin Alerts",
              description: "Receive instant notifications when transactions fall below your target profit margins so you can take immediate action.",
              icon: <BellRing className="h-6 w-6" />
            },
            {
              title: "Dynamic Financial Reporting",
              description: "Generate comprehensive profit and loss reports in real-time to make informed business decisions with the latest data.",
              icon: <Clock className="h-6 w-6" />
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
