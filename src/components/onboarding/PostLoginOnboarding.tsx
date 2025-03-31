
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CircleCheckBig, 
  Gauge, 
  Package, 
  Receipt, 
  Users, 
  FileBarChart, 
  Settings, 
  ShoppingBag,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { stableToast } from '@/components/ui/stable-toast';
import { useOnboarding } from '@/hooks/useOnboarding';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

export function PostLoginOnboarding() {
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const { completeOnboarding } = useOnboarding();

  const features: Feature[] = [
    {
      id: 'dashboard',
      title: 'Dashboard Overview',
      description: 'Get a quick snapshot of your pharmacy performance, sales, and inventory status at a glance.',
      icon: <Gauge size={24} />,
      completed: false
    },
    {
      id: 'inventory',
      title: 'Inventory Management',
      description: 'Track stock levels, manage products, set reorder points, and get alerts for expiring items.',
      icon: <Package size={24} />,
      completed: false
    },
    {
      id: 'billing',
      title: 'Billing System',
      description: 'Create quick invoices, manage payments, and maintain complete billing records for reporting.',
      icon: <Receipt size={24} />,
      completed: false
    },
    {
      id: 'patients',
      title: 'Patient Management',
      description: 'Maintain patient profiles with complete medication history and prescription tracking.',
      icon: <Users size={24} />,
      completed: false
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      description: 'Generate comprehensive financial reports, sales trends, and business insights.',
      icon: <FileBarChart size={24} />,
      completed: false
    },
    {
      id: 'optimization',
      title: 'Business Optimization',
      description: 'Access advanced forecasting tools, margin analysis, and data-driven business recommendations.',
      icon: <ShoppingBag size={24} />,
      completed: false
    }
  ];

  const handleComplete = () => {
    completeOnboarding();
    stableToast({ 
      title: "Welcome to Victure PharmEase!", 
      description: "You've completed the tour and are ready to go.",
      variant: "success",
    });
    setShowTutorial(false);
  };

  const handleNextFeature = () => {
    if (currentFeatureIndex < features.length - 1) {
      setCurrentFeatureIndex(prevIndex => prevIndex + 1);
    } else {
      handleComplete();
    }
  };

  if (!showTutorial) {
    return null;
  }

  const currentFeature = features[currentFeatureIndex];
  const progress = ((currentFeatureIndex + 1) / features.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden"
      >
        <div className="h-2 bg-gray-100 dark:bg-gray-800">
          <div 
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Welcome to Victure PharmEase</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleComplete}>
              <span className="sr-only">Close</span>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Let's explore key features to help you manage your pharmacy efficiently.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex gap-4 items-center p-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              {currentFeature.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-lg">{currentFeature.title}</h3>
              <p className="text-gray-500 dark:text-gray-400">{currentFeature.description}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-4">
            {features.map((feature, index) => (
              <button
                key={feature.id}
                className={`p-2 rounded-md flex flex-col items-center text-center text-xs ${
                  index === currentFeatureIndex
                    ? "bg-primary/10 text-primary"
                    : index < currentFeatureIndex
                    ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
                onClick={() => setCurrentFeatureIndex(index)}
              >
                <div className="mb-1">
                  {index < currentFeatureIndex ? (
                    <CircleCheckBig size={16} className="text-green-500" />
                  ) : (
                    feature.icon
                  )}
                </div>
                <span>{feature.title.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t p-4">
          <Button 
            variant="outline" 
            onClick={handleComplete}
          >
            Skip tutorial
          </Button>
          <Button onClick={handleNextFeature}>
            {currentFeatureIndex < features.length - 1 ? (
              <>Next <ChevronRight className="ml-1" size={16} /></>
            ) : (
              "Get Started"
            )}
          </Button>
        </CardFooter>
      </motion.div>
    </div>
  );
}
