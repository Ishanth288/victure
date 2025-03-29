
import { m } from "framer-motion";
import { Check } from "lucide-react";

const benefits = [
  "Real-time profit margin tracking per product and transaction",
  "AI-powered analytics for smarter business decisions",
  "Intelligent pricing optimization based on market trends",
  "Live inventory valuation with cost and selling price tracking",
  "Instant financial performance visualization",
  "Automated identification of high-profit products",
  "AI-driven demand forecasting and inventory suggestions",
  "Real-time alerts for low-profit transactions",
  "Reduced costs through AI-driven inventory optimization",
  "Increased efficiency with automated pricing calculations",
  "Enhanced financial transparency with live profit dashboards",
  "Dynamic pricing strategies based on real-time market data",
  "Improved cash flow management with profit-focused analytics",
  "Better inventory control with profit margin visibility",
  "Data-backed negotiation insights for supplier management"
];

export default function Benefits() {
  return (
    <section id="benefits" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold">Benefits</span>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mt-2">
            Experience the AI-Powered Advantage
          </h2>
          <p className="mt-4 text-lg text-neutral-600 max-w-3xl mx-auto">
            Our real-time analytics and profit optimization features give you the competitive edge in today's pharmacy market.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
