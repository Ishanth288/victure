
import React from "react";
import { SidebarLinks } from "@/components/dashboard/SidebarLinks";
import { cn } from "@/lib/utils";
import { useProfileData } from "@/components/dashboard/ProfileSection";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SidebarContainer() {
  const { profileData } = useProfileData();
  const navigate = useNavigate();
  
  return (
    <div className="w-60 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-y-auto">
      <div className="flex flex-col h-full p-3">
        <div className="mb-4 flex items-center space-x-2 pl-2">
          <button 
            onClick={() => navigate(-1)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-medium text-primary truncate">
            {profileData?.pharmacy_name || 'Medplus'}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarLinks />
        </div>
      </div>
    </div>
  );
}
