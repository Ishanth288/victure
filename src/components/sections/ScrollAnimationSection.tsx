import { memo } from "react";

// Memoize the ScrollAnimationSection component to prevent unnecessary re-renders
export const ScrollAnimationSection = memo(() => {
  return (
    <section id="scroll-animation" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold">About Us</span>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mt-2">
            Our Mission
          </h2>
          <p className="mt-4 text-lg text-neutral-600 max-w-2xl mx-auto">
            We're dedicated to transforming pharmacy operations through innovative technology
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-neutral-900">Streamlining Processes</h3>
              <p className="text-neutral-600">
                Our platform simplifies complex pharmacy workflows, allowing you to focus on what matters most - patient care. With automated inventory management, streamlined billing, and intuitive reporting, we help you run your pharmacy more efficiently.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-neutral-900">Enhancing Patient Care</h3>
              <p className="text-neutral-600">
                By reducing administrative burdens, our solution gives you more time to interact with patients and provide personalized care. Our platform helps you identify at-risk patients, manage medication adherence, and improve overall health outcomes.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-neutral-900">Driving Business Growth</h3>
              <p className="text-neutral-600">
                With powerful analytics and business intelligence tools, Victure helps you make data-driven decisions to grow your pharmacy business. Identify trends, optimize inventory, and maximize profitability with our comprehensive dashboard.
              </p>
            </div>
          </div>
          
          <div className="relative h-96 overflow-hidden rounded-lg shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 z-10"></div>
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-primary mb-4">Victure</h3>
                <p className="text-neutral-700 max-w-xs mx-auto">
                  Empowering pharmacies with innovative technology since 2020
                </p>
              </div>
            </div>
            <div className="h-full w-full bg-white"></div>
          </div>
        </div>
      </div>
    </section>
  );
});

ScrollAnimationSection.displayName = 'ScrollAnimationSection';
