
import { motion } from "framer-motion";
import { LayoutGrid, Users, ShoppingCart, LineChart, FileText } from "lucide-react";

const demoFeatures = [
  {
    icon: LayoutGrid,
    title: "Dashboard Overview",
    description: "Get a quick overview of your pharmacy's performance, sales, and inventory status all in one place.",
    image: "/placeholder.svg"
  },
  {
    icon: Users,
    title: "Patient Management",
    description: "Maintain detailed patient records, prescription history, and streamline communication.",
    image: "/placeholder.svg"
  },
  {
    icon: ShoppingCart,
    title: "Billing System",
    description: "Generate invoices, process payments, and manage transactions effortlessly.",
    image: "/placeholder.svg"
  },
  {
    icon: LineChart,
    title: "Analytics & Reports",
    description: "Track sales trends, inventory levels, and generate comprehensive business reports.",
    image: "/placeholder.svg"
  },
  {
    icon: FileText,
    title: "Digital Prescriptions",
    description: "Manage digital prescriptions, verify details, and process refills efficiently.",
    image: "/placeholder.svg"
  }
];

export default function Demo() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold">Demo</span>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mt-2">
            See Victure in Action
          </h2>
          <p className="mt-4 text-lg text-neutral-600 max-w-2xl mx-auto">
            Experience how Victure streamlines your pharmacy operations with these powerful features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {demoFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
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
}
