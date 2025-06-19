
import { m } from "framer-motion";
import { useState } from "react";
import {
  LayoutGrid, Package, ShoppingCart, LineChart, FileText, Pill,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "./ui/button";

const demoSlides = [];

export default function Demo() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % demoSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + demoSlides.length) % demoSlides.length);
  };

  if (demoSlides.length === 0) {
    return null;
  }

  const slide = demoSlides[currentSlide];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold">Demo</span>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mt-2">
            Experience Victure in Action
          </h2>
          <p className="mt-4 text-lg text-neutral-600 max-w-2xl mx-auto">
            See how our platform transforms your pharmacy operations
          </p>
        </div>

        <m.div
          key={currentSlide}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className={`rounded-2xl ${slide.bgColor} p-8 md:p-12 max-w-5xl mx-auto slide-horizontal`}
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="inline-block p-3 rounded-lg bg-white/80 backdrop-blur">
                <slide.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900">{slide.title}</h3>
              <p className="text-neutral-600">{slide.description}</p>
              <ul className="grid grid-cols-2 gap-3">
                {slide.features.map((feature) => (
                  <li key={feature} className="flex items-center space-x-2 text-sm text-neutral-700">
                    <Pill className="w-4 h-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden shadow-lg">
              <img 
                src={slide.image} 
                alt={slide.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center">
                <slide.icon className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8 space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="rounded-full border-primary text-primary hover:bg-primary/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex space-x-2">
              {demoSlides.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide ? "bg-primary" : "bg-neutral-300"
                  }`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="rounded-full border-primary text-primary hover:bg-primary/10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </m.div>
      </div>
    </section>
  );
}
