
import { Button } from "@/components/ui/button";
import { m } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function CTA() {
  const navigate = useNavigate();

  const handleGetStartedFree = () => {
    navigate('/auth', { 
      state: { 
        isLogin: false, 
        fromPricing: true,
        planType: 'Free Trial'
      } 
    });
  };

  const handleRequestDemo = () => {
    // Open email client
    window.location.href = "mailto:thugs.business@gmail.com?subject=Demo Request for Victure Pharmacy Management";
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <m.div 
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">
            Ready to Transform Your Pharmacy?
          </h2>
          <p className="text-lg text-neutral-600 mb-8">
            Join thousands of pharmacies that trust Victure to streamline their operations
            and provide better patient care.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-8 py-6 text-lg"
              onClick={handleGetStartedFree}
            >
              Get Started Free
            </Button>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto px-8 py-6 text-lg"
              onClick={handleRequestDemo}
            >
              Request a Demo
            </Button>
          </div>
        </m.div>
      </div>
    </section>
  );
}
