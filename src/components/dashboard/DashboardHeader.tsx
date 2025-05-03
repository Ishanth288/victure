
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardHeaderProps {
  title: string;
  pharmacyName?: string; // Make this prop optional
  isSidebarOpen: boolean;
}

export function DashboardHeader({ title, isSidebarOpen }: DashboardHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };
  
  return (
    <div className="flex items-center h-16 px-4 border-b border-neutral-200 overflow-hidden bg-white rounded-t-lg shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="mr-2 flex-shrink-0 text-gray-600 hover:text-primary hover:bg-gray-100"
        onClick={handleBack}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <div className="flex items-center">
        <h1 className="text-lg font-medium text-gray-800 truncate">
          {title}
        </h1>
      </div>
    </div>
  );
}
