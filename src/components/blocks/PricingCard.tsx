
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  planId?: string;
  href: string;
  isPopular: boolean;
}

interface PricingCardProps {
  plan: PricingPlan;
  index: number;
  isMonthly: boolean;
  isDesktop: boolean;
  isLoading: string | null;
  handlePlanSelection: (plan: PricingPlan) => void;
}

const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  index,
  isMonthly,
  isDesktop,
  isLoading,
  handlePlanSelection
}) => {
  const price = isMonthly ? plan.price : plan.yearlyPrice;
  const isCurrentLoading = isLoading === plan.name;

  return (
    <motion.div
      initial={isDesktop ? { opacity: 0, y: 50 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative ${plan.isPopular ? 'z-10' : ''}`}
    >
      <Card className={`h-full ${plan.isPopular ? 'border-primary border-2 shadow-lg' : 'border-gray-200'}`}>
        {plan.isPopular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </span>
          </div>
        )}
        
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
          <CardDescription className="text-gray-600">{plan.description}</CardDescription>
          <div className="mt-4">
            <span className="text-4xl font-bold">₹{price}</span>
            <span className="text-gray-600 ml-1">{plan.period}</span>
          </div>
        </CardHeader>
        
        <CardContent>
          <ul className="space-y-3">
            {plan.features.map((feature, featureIndex) => (
              <li key={featureIndex} className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        
        <CardFooter>
          <Button
            className={`w-full ${plan.isPopular ? 'bg-primary hover:bg-primary/90' : 'bg-gray-900 hover:bg-gray-800'} text-white`}
            onClick={() => handlePlanSelection(plan)}
            disabled={isCurrentLoading}
          >
            {isCurrentLoading ? 'Loading...' : plan.buttonText}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PricingCard;
