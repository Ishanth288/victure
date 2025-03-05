
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Benefits from "@/components/Benefits";
import Demo from "@/components/Demo";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { Pricing } from "@/components/blocks/Pricing";

const pricingPlans = [
  {
    name: "FREE",
    price: "0",
    yearlyPrice: "0",
    period: "per month",
    features: [
      "30-day trial access",
      "Limited to 501 products in inventory",
      "30 bills per day",
      "600 bills per month",
      "Basic pharmacy management",
      "Standard customer support",
    ],
    description: "Perfect for trying out the system",
    buttonText: "Get Started",
    href: "/auth?signup=true",
    isPopular: false,
  },
  {
    name: "PRO",
    price: "2,899",
    yearlyPrice: "24,299",
    period: "per month",
    features: [
      "Annual access",
      "Up to 4001 products in inventory",
      "1501 bills per month",
      "1501 patients per month",
      "Data storage for 1 year",
      "Access to insights page",
      "Advanced reporting",
      "Priority customer support",
    ],
    description: "Best for growing pharmacies",
    buttonText: "Contact Sales",
    href: "mailto:thugs.business@gmail.com",
    isPopular: true,
  },
  {
    name: "PRO PLUS",
    price: "6,899",
    yearlyPrice: "69,699",
    period: "per month",
    features: [
      "Everything in Pro plan",
      "Up to 10,000 products in inventory",
      "10,000 bills per month",
      "10,000 patients per month",
      "Custom website for multibranch",
      "Premium AI insights every month",
      "Dedicated account manager",
      "Custom integrations",
      "Advanced data analytics",
    ],
    description: "For large pharmacy chains with multiple locations",
    buttonText: "Contact Sales",
    href: "mailto:thugs.business@gmail.com",
    isPopular: false,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main>
        <Hero />
        <Features />
        <Benefits />
        <Demo />
        <div id="pricing">
          <Pricing 
            plans={pricingPlans}
            title="Choose Your Perfect Plan"
            description="Select the plan that best fits your pharmacy needs. All plans include our powerful pharmacy management features."
          />
        </div>
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
