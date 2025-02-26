
import { HashLink } from 'react-router-hash-link';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Hero() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth', { state: { isLogin: false } });
  };

  return (
    <section className="pt-32 pb-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Transform Your Pharmacy Management
          </motion.h1>
          <motion.p 
            className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Streamline operations, enhance patient care, and grow your business with our comprehensive pharmacy management system
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white px-8"
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
            <HashLink smooth to="#features">
              <Button 
                variant="outline" 
                size="lg"
                className="px-8"
              >
                Learn More
              </Button>
            </HashLink>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
