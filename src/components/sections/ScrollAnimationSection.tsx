
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { AnimatedGradientBorder } from "@/components/ui/animated-gradient-border";
import { CardTilt } from "@/components/ui/card-tilt";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Database, Stethoscope, Rocket, BellRing, Clock, Shield } from "lucide-react";
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
            Streamlined Operations at Your Fingertips
          </p>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 h-full items-center">
        <div className="flex flex-col space-y-4">
          {[
            {
              title: "Inventory Management",
              description: "Track stock levels, manage expiry dates, and automate reordering with our intelligent inventory system.",
              icon: <Database className="h-6 w-6" />
            },
            {
              title: "Patient Care",
              description: "Store patient records securely and access medication histories instantly for better care.",
              icon: <Stethoscope className="h-6 w-6" />
            },
            {
              title: "Billing & Reporting",
              description: "Generate invoices in seconds and gain valuable insights with comprehensive analytics.",
              icon: <Rocket className="h-6 w-6" />
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
              title: "Notifications",
              description: "Stay informed with real-time alerts for low stock, upcoming expiry dates, and prescription refills.",
              icon: <BellRing className="h-6 w-6" />
            },
            {
              title: "Appointment Scheduling",
              description: "Manage patient appointments and follow-ups with an intuitive calendar interface.",
              icon: <Clock className="h-6 w-6" />
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
