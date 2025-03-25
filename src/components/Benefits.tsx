
import { m } from "framer-motion";
import { Check } from "lucide-react";

const benefits = [
  "Increased efficiency and productivity",
  "Reduced costs and waste",
  "Improved patient safety and satisfaction",
  "Streamlined workflows",
  "Enhanced compliance",
  "Better inventory control",
  "Reduced medication errors",
  "Improved customer service"
];

export default function Benefits() {
  return (
    <section id="benefits" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold">Benefits</span>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mt-2">
            Experience the Victure Advantage
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <m.div
              key={benefit}
              className="flex items-start space-x-3"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-neutral-700 font-medium">{benefit}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
