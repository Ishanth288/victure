
import { BarChart4, UserCircle2, Package, Syringe, Link, FileText, Calculator, TrendingUp } from "lucide-react";
import { m } from "framer-motion";
import { memo } from "react";

const features = [
  {
    icon: Package,
    title: "Inventory Management",
    description: "Real-time inventory tracking with automated reordering, cost price and selling price management, and expiry management to minimize waste and optimize stock levels."
  },
  {
    icon: Syringe,
    title: "Prescription Management",
    description: "Efficiently process prescriptions, manage refills, and ensure accuracy with integrated drug databases and safety checks."
  },
  {
    icon: UserCircle2,
    title: "Patient Management",
    description: "Centralized patient records, medication history, and communication tools to enhance patient care and streamline workflows."
  },
  {
    icon: BarChart4,
    title: "Real-Time Analytics",
    description: "Advanced AI-powered analytics that process your sales and inventory data in real-time, providing instant insights into business performance and profit margins."
  },
  {
    icon: TrendingUp,
    title: "AI-Driven Business Optimization",
    description: "Smart algorithms analyze your pricing, sales patterns, and profit margins to suggest optimal pricing strategies and inventory adjustments for maximum profitability."
  },
  {
    icon: Calculator,
    title: "Dynamic Profit Tracking",
    description: "Automatically calculate and track profits based on cost price and selling price, with real-time updates as sales and purchases occur."
  },
  {
    icon: Link,
    title: "Integration",
    description: "Seamlessly integrate with other pharmacy systems, insurance providers, and healthcare platforms."
  },
  {
    icon: FileText,
    title: "Purchase Book",
    description: "Efficiently manage and track supplier purchase orders, maintain delivery records, and organize procurement in one place with price history tracking."
  }
];

// Memoize the Features component to prevent unnecessary re-renders
export default memo(function Features() {
  return (
    <section id="features" className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold">Features</span>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mt-2">
            Key Features to Empower Your Pharmacy
          </h2>
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
