
import { HashLink } from 'react-router-hash-link';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { m } from "framer-motion";

export default function Hero() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGetStarted = () => {
    // Navigate to pricing section
    if (location.pathname === '/') {
      // On home page, scroll directly
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // From other pages, navigate to home with pricing anchor
      navigate('/#pricing');
    }
  };

  const handleLearnMore = () => {
    // Navigate to features section
    if (location.pathname === '/') {
      // On home page, scroll directly
      const featuresSection = document.getElementById('features');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // From other pages, navigate to home with features anchor
      navigate('/#features');
    }
  };

  return (
    <section className="pt-32 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <m.h1 
            className="text-4xl md:text-6xl font-bold text-neutral-900 dark:text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Transform Your Pharmacy Management
          </m.h1>
          <m.p 
            className="text-xl text-neutral-600 dark:text-neutral-300 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Streamline operations, maximize profits with real-time AI analytics, and enhance patient care with our comprehensive pharmacy management system
          </m.p>
          <m.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <HashLink smooth to="#pricing">
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-8 w-full sm:w-auto"
              >
                Get Started
              </Button>
            </HashLink>
            <HashLink smooth to="#features">
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 border-neutral-300 dark:border-white/20 bg-transparent backdrop-blur-sm hover:bg-white/10 text-neutral-800 dark:text-white w-full sm:w-auto"
              >
                Learn More
              </Button>
            </HashLink>
          </m.div>
        </div>
      </div>
    </section>
  );
}
