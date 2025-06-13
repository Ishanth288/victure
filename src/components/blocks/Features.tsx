
import { BarChart4, Brain, Package, Calculator, ChartPie, Clock } from "lucide-react";
import { m } from "framer-motion";
import { memo } from "react";

const features = [
  {
    icon: Brain,
    title: "AI-Driven Business Optimization",
    description: "Advanced algorithms analyze your business data in real-time to suggest optimal pricing strategies, inventory levels, and business decisions to maximize profit margins."
  },
  {
    icon: BarChart4,
    title: "Real-Time Analytics Dashboard",
    description: "Powerful AI-powered analytics process your sales and inventory data instantly, providing real-time insights into business performance and profit margins at a glance."
  },
  {
    icon: Package,
    title: "Smart Inventory Management",
    description: "Real-time inventory tracking with AI-powered reordering suggestions, cost price and selling price management, and expiry management to minimize waste and optimize stock levels."
  },
  {
    icon: Calculator,
    title: "Dynamic Profit Tracking",
    description: "Automatically calculate and track profits based on cost price and selling price with instant updates as sales and purchases occur, ensuring you always know your margins."
  },
  {
    icon: ChartPie,
    title: "Profit Margin Analytics",
    description: "Comprehensive analytics that break down profit margins by product, category, and time period, helping you identify your most profitable items and selling patterns."
  },
  {
    icon: Clock,
    title: "Real-Time Financial Monitoring",
    description: "Monitor your pharmacy's financial health with live updates on sales, revenue, and profit margins as transactions happen throughout the day."
  }
];

export const Features = memo(function Features() {
  return (
    <section id="features" className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold">Features</span>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mt-2">
            AI-Powered Features to Transform Your Pharmacy
          </h2>
          <p className="mt-4 text-lg text-neutral-600 max-w-3xl mx-auto">
            Our cutting-edge technology delivers real-time insights and automated optimization to maximize your profitability and operational efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <m.div
              key={feature.title}
              className="glass-card rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <feature.icon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-neutral-600">
                {feature.description}
              </p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
});
