import { useLocation, useNavigate } from "react-router-dom";
import { Home, Package, Users, Settings } from "lucide-react";

const tabs = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Inventory", icon: Package, path: "/mobile/inventory" },
  { label: "Patients", icon: Users, path: "/mobile/patients" },
  { label: "Settings", icon: Settings, path: "/mobile/settings" },
];

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex justify-around items-center h-16 md:hidden shadow-lg">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${isActive ? "text-teal-600" : "text-gray-500"}`}
            aria-label={tab.label}
          >
            <tab.icon className={`h-6 w-6 mb-1 ${isActive ? "stroke-2" : "stroke-1.5"}`} />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}