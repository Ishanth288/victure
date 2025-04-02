
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
  ChevronRight, 
  ShoppingBag, 
  RotateCcw, 
  LineChart, 
  LogOut 
} from "lucide-react";
import { useState } from "react";

export function SidebarLinks() {
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
      title: "Prescriptions",
      icon: <FileSpreadsheet className="mr-2 h-4 w-4" />,
      href: "/prescriptions"
    },
    {
      title: "Patients",
      icon: <Users className="mr-2 h-4 w-4" />,
      href: "/patients"
    },
    {
      title: "Purchases",
      icon: <ShoppingBag className="mr-2 h-4 w-4" />,
      href: "/purchases"
    },
    {
      title: "Insights", 
      icon: <LineChart className="mr-2 h-4 w-4" />,
      href: "/insights"
    },
    {
      title: "Business Optimization",
      icon: <BarChart2 className="mr-2 h-4 w-4" />,
      href: "/business-optimization",
      subItems: [
        { title: "Market Forecast", href: "/business-optimization?tab=forecast" },
        { title: "Margin Analysis", href: "/business-optimization?tab=margin" },
        { title: "Supplier Metrics", href: "/business-optimization?tab=supplier" },
        { title: "Expiry Analysis", href: "/business-optimization?tab=expiry" },
        { title: "Seasonal Trends", href: "/business-optimization?tab=seasonal" },
        { title: "Regional Demand", href: "/business-optimization?tab=regional" },
        { title: "Return Analysis", href: "/business-optimization?tab=returns" }
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

  return (
    <div className="flex flex-col space-y-1">
      {links.map((link, index) => (
        <div key={index} className="flex flex-col">
          <a
            href={link.href}
            onClick={(e) => {
              if (link.subItems) {
                e.preventDefault();
                toggleSubMenu(link.title);
              } else {
                handleClick(e, link.href);
              }
            }}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              isCurrentPath(link.href)
                ? "bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-900"
                : "hover:bg-green-50 hover:text-green-700",
              "justify-start",
              link.subItems ? "flex justify-between" : ""
            )}
          >
            <div className="flex items-center">
              {link.icon}
              <span>{link.title}</span>
            </div>
            {link.subItems && (
              <ChevronRight 
                className={`h-4 w-4 transition-transform duration-200 ${expandedItems[link.title] ? 'rotate-90' : ''}`} 
              />
            )}
          </a>
          
          {link.subItems && expandedItems[link.title] && (
            <div className="ml-6 mt-1 flex flex-col space-y-1 border-l-2 border-gray-200 pl-2">
              {link.subItems.map((subItem, subIndex) => (
                <a
                  key={`${index}-${subIndex}`}
                  href={subItem.href}
                  onClick={(e) => handleClick(e, subItem.href)}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    location.pathname + location.search === subItem.href
                      ? "bg-green-50 text-green-700"
                      : "hover:bg-green-50 hover:text-green-700",
                    "justify-start text-sm py-1 h-8"
                  )}
                >
                  <span>{subItem.title}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Add Sign Out link at the bottom */}
      <div className="mt-auto pt-4">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            // Handle sign out logic here
            navigate('/auth');
          }}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "justify-start hover:bg-green-50 hover:text-green-700"
          )}
        >
          <div className="flex items-center">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </div>
        </a>
      </div>
    </div>
  );
}
