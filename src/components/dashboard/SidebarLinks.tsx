
import { 
  LayoutGrid, Package, Users, FileText, LineChart, Settings,
  DollarSign, LogOut, ShoppingCart, FileTerminal, TrendingUp 
} from "lucide-react";
import { SidebarLink } from "@/components/ui/sidebar";

export const sidebarLinksData = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutGrid className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: <Package className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
  },
  {
    label: "Billing",
    href: "/billing",
    icon: <DollarSign className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
  },
  {
    label: "Prescriptions",
    href: "/prescriptions",
    icon: <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
  },
  {
    label: "Patients",
    href: "/patients",
    icon: <Users className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
  },
  {
    label: "Purchases",
    href: "/purchases",
    icon: <ShoppingCart className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
  },
  {
    label: "Insights",
    href: "/insights",
    icon: <LineChart className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
  },
  {
    label: "Business Optimization",
    href: "/business-optimization",
    icon: <TrendingUp className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
  },
  {
    label: "Terms & Conditions",
    href: "/legal/terms-of-service",
    icon: <FileTerminal className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
  },
  {
    label: "Sign Out",
    href: "#",
    icon: <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
  }
];

interface SidebarLinksProps {
  startIndex: number;
  endIndex: number;
  onClick?: (index: number) => void;
}

export function SidebarLinks({ startIndex, endIndex, onClick }: SidebarLinksProps) {
  const links = sidebarLinksData.slice(startIndex, endIndex);
  
  return (
    <>
      {links.map((link, idx) => (
        <SidebarLink 
          key={idx} 
          link={link} 
          className={link.href === "#" ? "cursor-pointer" : undefined}
          onClick={onClick ? () => onClick(startIndex + idx) : undefined}
        />
      ))}
    </>
  );
}
