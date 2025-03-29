
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { CardTilt } from "@/components/ui/card-tilt";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Database, Brain, TrendingUp, BarChart, Clock, DollarSign } from "lucide-react";
import { memo } from "react";

// Memoize the component to prevent unnecessary re-renders
export const ScrollAnimationSection = memo(() => {
  const featureCards = [
    {
      title: "AI-Powered Inventory Tracking",
      description: "Advanced machine learning algorithms analyze your inventory in real-time, providing actionable insights for optimal stock management.",
      icon: <Database className="h-6 w-6" />
    },
    {
      title: "Intelligent Pricing Optimization",
      description: "Our AI calculates the most profitable pricing strategies by analyzing market trends, competitor pricing, and your sales data.",
      icon: <Brain className="h-6 w-6" />
    },
    {
      title: "Real-Time Profit Analytics",
      description: "Instant visualization of profit margins, sales trends, and financial performance across your entire pharmacy operation.",
      icon: <TrendingUp className="h-6 w-6" />
    },
    {
      title: "Dynamic Financial Reporting",
      description: "Comprehensive, up-to-the-minute financial reports that help you make informed business decisions quickly.",
      icon: <BarChart className="h-6 w-6" />
    },
    {
      title: "Predictive Inventory Alerts",
      description: "Receive proactive notifications about potential stock shortages, expiring products, and reordering recommendations.",
      icon: <Clock className="h-6 w-6" />
    },
    {
      title: "Profit Margin Maximization",
      description: "AI-driven insights that identify your most profitable products and suggest strategies to enhance overall financial performance.",
      icon: <DollarSign className="h-6 w-6" />
    }
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 h-full">
        {featureCards.map((item, index) => (
          <ScrollReveal 
            key={index}
            animation="fade" 
            delay={index * 0.1}
            className="h-full"
          >
            <CardTilt className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-primary">{item.icon}</div>
                <h3 className="text-xl font-bold text-primary">{item.title}</h3>
              </div>
              <p className="text-neutral-700 flex-grow">{item.description}</p>
            </CardTilt>
          </ScrollReveal>
        ))}
      </div>
    </ContainerScroll>
  );
});

ScrollAnimationSection.displayName = 'ScrollAnimationSection';
