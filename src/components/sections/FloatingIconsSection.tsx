
import { FloatingIcon } from "@/components/ui/floating-icon";
import { Pill, PencilRuler, Rocket, Database, CloudCog, Cpu, BrainCircuit, Microscope } from "lucide-react";

export const FloatingIconsSection = () => {
  return (
    <div className="overflow-hidden -mt-32 relative">
      <FloatingIcon 
        icon={Pill} 
        color="text-blue-500" 
        size={32} 
        className="top-20 left-[10%]" 
        delay={0.2}
      />
      <FloatingIcon 
        icon={PencilRuler} 
        color="text-indigo-500" 
        size={28} 
        className="top-40 right-[15%]" 
        delay={0.5}
      />
      <FloatingIcon 
        icon={Rocket} 
        color="text-primary" 
        size={24} 
        className="top-80 left-[25%]" 
        delay={0.8}
      />
      <FloatingIcon 
        icon={BrainCircuit} 
        color="text-secondary" 
        size={26} 
        className="top-30 right-[25%]" 
        delay={0.3}
      />
      <FloatingIcon 
        icon={Microscope} 
        color="text-primary-dark" 
        size={30} 
        className="top-60 left-[40%]" 
        delay={0.7}
      />
    </div>
  );
};
