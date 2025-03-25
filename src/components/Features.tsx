
import { BarChart4, UserCircle2, Package, Syringe, Link, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { memo } from "react";

const features = [
  {
    icon: Package,
    title: "Inventory Management",
    description: "Real-time inventory tracking, automated reordering, and expiry management to minimize waste and optimize stock levels."
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
    title: "Reporting & Analytics",
    description: "Gain valuable insights into your pharmacy's performance with comprehensive reports and analytics dashboards."
  },
  {
    icon: Link,
    title: "Integration",
    description: "Seamlessly integrate with other pharmacy systems, insurance providers, and healthcare platforms."
  },
  {
    icon: FileText,
    title: "Purchase Book",
    description: "Efficiently manage and track supplier purchase orders, maintain delivery records, and organize procurement in one place."
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
            <motion.div
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});
