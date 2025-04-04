import React from "react";
import { SidebarLinks } from "@/components/dashboard/SidebarLinks"; // Renders the main nav links
import { cn } from "@/lib/utils";
import { useProfileData } from "@/components/dashboard/ProfileSection"; // Assuming this hook exists
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdminAccessButton } from '@/components/admin/AdminAccess'; // <-- 1. Import the new button component
import { Separator } from "@/components/ui/separator"; // <-- Import Separator for visual spacing

export function SidebarContainer() {
  const { profileData } = useProfileData(); // Assuming this provides necessary data
  const navigate = useNavigate();

  // Fallback pharmacy name if profile data isn't loaded yet
  const pharmacyName = profileData?.pharmacy_name || 'Victure';

  return (
    // Ensure overflow-y-auto allows scrolling if content exceeds height
    <div className={cn(
        "w-60 h-screen bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800",
        "flex flex-col flex-shrink-0" // Use flex-col to manage layout
      )}>
      {/* Header Section */}
      <div className="p-3 border-b dark:border-gray-800"> {/* Added border */}
        <div className="flex items-center space-x-2 pl-1"> {/* Adjusted padding */}
          <button
            onClick={() => navigate(-1)} // Navigate back
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" // Adjusted padding/styling
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate" title={pharmacyName}>
            {/* Display pharmacy name, truncate if too long */}
            {pharmacyName}
          </h2>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto py-3"> {/* Added padding */}
         {/* === 2. Add the Admin Access Button === */}
         <div className="px-3 mb-2"> {/* Add some padding and margin */}
            <AdminAccessButton />
            <Separator className="my-3" /> {/* Add a visual separator */}
         </div>
         {/* ==================================== */}

         {/* Render the main navigation links */}
         <SidebarLinks />
      </div>

      {/* Optional Footer Section (Example) */}
      {/*
      <div className="p-3 border-t dark:border-gray-800 mt-auto">
         <p className="text-xs text-muted-foreground text-center">© {new Date().getFullYear()}</p>
      </div>
      */}
    </div>
  );
}
