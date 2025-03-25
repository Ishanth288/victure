
import { BarChart4, UserCircle2, Package, Syringe, Link, FileText } from "lucide-react";
import { m, useReducedMotion } from "framer-motion";
import { memo, useState } from "react";
import { CardTilt } from "./ui/card-tilt";

const features = [
  {
    icon: Package,
    title: "Inventory Management",
    description: "Track stock levels, manage expiry dates, and automate reordering with our intelligent inventory system."
  },
  {
    icon: UserCircle2,
    title: "Patient Care",
    description: "Store patient records securely and access medication histories instantly for better care."
  },
  {
    icon: BarChart4,
    title: "Billing & Reporting",
    description: "Generate invoices in seconds and gain valuable insights with comprehensive analytics."
  },
  {
    icon: Syringe,
    title: "Prescription Management",
    description: "Efficiently process prescriptions, manage refills, and ensure accuracy with integrated drug databases."
  },
  {
    icon: Link,
    title: "Integration",
    description: "Seamlessly integrate with other pharmacy systems, insurance providers, and healthcare platforms."
  },
  {
    icon: FileText,
    title: "Purchase Book",
    description: "Efficiently manage and track supplier purchase orders, maintain delivery records, and organize procurement."
  }
];

// Optimized Feature card component
const FeatureCard = memo(({ feature, isActive, onClick }: { 
  feature: typeof features[0], 
  isActive: boolean,
  onClick: () => void
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <m.div
      className={`rounded-xl p-6 cursor-pointer transition-all duration-300 ${
        isActive ? "bg-white shadow-lg" : "bg-transparent hover:bg-white/50"
      }`}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
    >
      <feature.icon className={`w-8 h-8 mb-4 ${isActive ? "text-primary" : "text-neutral-500"}`} />
      <h3 className={`text-xl font-semibold mb-2 ${isActive ? "text-primary" : "text-neutral-700"}`}>
        {feature.title}
      </h3>
      {isActive && (
        <m.p 
          className="text-neutral-600"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          {feature.description}
        </m.p>
      )}
    </m.div>
  );
});

FeatureCard.displayName = 'FeatureCard';

// Company logo component
const CompanyPromotion = memo(() => {
  return (
    <m.div 
      className="relative h-full flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-light/30 via-secondary-light/20 to-primary/40 rounded-xl opacity-70"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/30 rounded-xl opacity-40 animate-pulse-glow"></div>
      
      <div className="relative z-10 text-center">
        <m.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6"
        >
          <img 
            src="/lovable-uploads/62f25d64-5bf3-40f1-92f4-94d2d683cfdb.png" 
            alt="Victure Logo" 
            className="w-32 h-32 object-contain mx-auto" 
          />
        </m.div>
        
        <m.h2 
          className="text-3xl md:text-4xl font-bold mb-4 text-gradient-primary"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Victure
        </m.h2>
        
        <m.p 
          className="text-lg text-neutral-800 max-w-md mx-auto font-medium"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          The future of pharmacy management is here.
          Experience the next generation of pharmacy tools.
        </m.p>
        
        <CardTilt className="mt-8 bg-white/80 backdrop-blur-sm p-4 max-w-xs mx-auto">
          <p className="text-neutral-700 text-sm">
            "Transforming pharmacy operations with cutting-edge technology and intuitive design."
          </p>
        </CardTilt>
      </div>
    </m.div>
  );
});

CompanyPromotion.displayName = 'CompanyPromotion';

// Optimized Features component with tab-like structure
export default memo(function Features() {
  const [activeFeature, setActiveFeature] = useState(0);
  
  return (
    <section id="features" className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold">Features</span>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mt-2">
            Key Features to Empower Your Pharmacy
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left side: Features list */}
          <div className="bg-neutral-100/50 rounded-xl p-4 shadow-sm">
            <div className="space-y-2">
              {features.map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  feature={feature}
                  isActive={activeFeature === index}
                  onClick={() => setActiveFeature(index)}
                />
              ))}
            </div>
          </div>
          
          {/* Right side: Company promotion with gradients */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <CompanyPromotion />
          </div>
        </div>
      </div>
    </section>
  );
});
