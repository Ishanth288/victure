
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  PackageOpen, 
  FileText, 
  Users, 
  FileSpreadsheet, 
  Settings, 
  BarChart2, 
  ChevronRight 
} from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { SidebarLinks } from "@/components/dashboard/SidebarLinks";

// Define an interface for the PaginationProps to fix TypeScript errors
interface PaginationProps {
  startIndex: number;
  endIndex: number;
  onClick: (index: number) => void;
}

export function SidebarContainer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleSubMenu = (key: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isCurrentPath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const links = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
      href: "/dashboard"
    },
    {
      title: "Inventory",
      icon: <PackageOpen className="mr-2 h-4 w-4" />,
      href: "/inventory"
    },
    {
      title: "Billing",
      icon: <FileText className="mr-2 h-4 w-4" />,
      href: "/billing"
    },
    {
      title: "Patients",
      icon: <Users className="mr-2 h-4 w-4" />,
      href: "/patients"
    },
    {
      title: "Prescriptions",
      icon: <FileSpreadsheet className="mr-2 h-4 w-4" />,
      href: "/prescriptions"
    },
    {
      title: "Business Analytics",
      icon: <BarChart2 className="mr-2 h-4 w-4" />,
      href: "/business-optimization",
      subItems: [
        { title: "Market Forecast", href: "/business-optimization?tab=forecast" },
        { title: "Margin Analysis", href: "/business-optimization?tab=margin" },
        { title: "Supplier Metrics", href: "/business-optimization?tab=supplier" },
        { title: "Expiry Analysis", href: "/business-optimization?tab=expiry" },
        { title: "Seasonal Trends", href: "/business-optimization?tab=seasonal" },
        { title: "Regional Demand", href: "/business-optimization?tab=regional" }
      ]
    },
    {
      title: "Settings",
      icon: <Settings className="mr-2 h-4 w-4" />,
      href: "/settings"
    }
  ];

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    navigate(href);
  };

  // Modify the Pagination component to use the new interface
  const Pagination = ({ 
    startIndex, 
    endIndex, 
    onClick 
  }: PaginationProps) => {
    // Implement pagination logic here
    return (
      <div className="flex justify-between items-center">
        {/* Pagination implementation */}
      </div>
    );
  };

  return (
    <ResizablePanelGroup 
      direction="horizontal" 
      className="h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800"
    >
      <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
        <div className="flex flex-col h-full p-3 w-60">
          <div className="mb-4 flex-1">
            <div className="space-y-2.5">
              <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground">
                Manage your pharmacy with ease.
              </p>
            </div>
          </div>
          <div className="flex-1">
            <SidebarLinks />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      
      {/* Add Pagination component with correct prop types */}
      <Pagination 
        startIndex={0} 
        endIndex={10} 
        onClick={(index) => {
          // Handle pagination click
          console.log(`Clicked page ${index}`);
        }} 
      />
    </ResizablePanelGroup>
  );
}
