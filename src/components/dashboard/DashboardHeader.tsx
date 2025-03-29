
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardHeaderProps {
  title: string;
  pharmacyName: string;
  isSidebarOpen: boolean;
}

export function DashboardHeader({ title, pharmacyName, isSidebarOpen }: DashboardHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };
  
  return (
    <div className="flex items-center h-16 px-4 border-b border-neutral-200 overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className="mr-2 flex-shrink-0"
        onClick={handleBack}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <motion.div 
        className="flex items-center overflow-hidden"
        animate={{ 
          width: isSidebarOpen ? "auto" : "0px",
          opacity: isSidebarOpen ? 1 : 0
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <span className="text-lg font-medium text-primary truncate">
          {pharmacyName || 'Medplus'}
        </span>
      </motion.div>
    </div>
  );
}
