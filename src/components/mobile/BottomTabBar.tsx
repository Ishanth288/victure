import { useNavigate, useLocation } from "react-router-dom";
import { Home, Package, Users, FileText, BarChart3 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { hapticFeedback } from "@/utils/mobileUtils";

interface TabItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

const tabs: TabItem[] = [
  { 
    path: "/mobile", 
    icon: Home, 
    label: "Home", 
    description: "Go to dashboard home" 
  },
  { 
    path: "/mobile/inventory", 
    icon: Package, 
    label: "Inventory", 
    description: "Manage pharmacy inventory" 
  },
  { 
    path: "/mobile/patients", 
    icon: Users, 
    label: "Patients", 
    description: "View patient records" 
  },
  { 
    path: "/mobile/prescriptions", 
    icon: FileText, 
    label: "Prescriptions", 
    description: "Manage prescriptions" 
  },
  { 
    path: "/mobile/insights", 
    icon: BarChart3, 
    label: "Insights", 
    description: "View business analytics" 
  },
];

export function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Update active index when location changes
  useEffect(() => {
    const currentIndex = tabs.findIndex(tab => tab.path === location.pathname);
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname]);

  const handleTabClick = useCallback(async (tab: TabItem, index: number) => {
    // Provide haptic feedback for native apps
    await hapticFeedback('light');
    
    setActiveIndex(index);
    navigate(tab.path);
  }, [navigate]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, tab: TabItem, index: number) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleTabClick(tab, index);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex = index > 0 ? index - 1 : tabs.length - 1;
        tabRefs.current[prevIndex]?.focus();
        break;
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = index < tabs.length - 1 ? index + 1 : 0;
        tabRefs.current[nextIndex]?.focus();
        break;
      case 'Home':
        event.preventDefault();
        tabRefs.current[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        tabRefs.current[tabs.length - 1]?.focus();
        break;
    }
  }, [handleTabClick]);

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom, 0px)' 
      }}
      role="tablist"
      aria-label="Mobile navigation"
    >
      <div className="flex justify-around items-center py-2 px-4">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeIndex === index;
          
          return (
            <button
              key={tab.path}
              ref={(el) => (tabRefs.current[index] = el)}
              onClick={() => handleTabClick(tab, index)}
              onKeyDown={(e) => handleKeyDown(e, tab, index)}
              className={`
                flex flex-col items-center justify-center px-3 py-2 rounded-lg
                transition-all duration-200 ease-in-out
                min-h-[60px] min-w-[60px]
                ${isActive 
                  ? 'text-teal-600 bg-teal-50 scale-105' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
                focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
                active:scale-95
              `}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.description}
              aria-controls={`panel-${tab.path.replace('/', '-')}`}
              tabIndex={isActive ? 0 : -1}
            >
              <Icon 
                className={`h-5 w-5 mb-1 transition-transform duration-200 ${
                  isActive ? 'scale-110' : ''
                }`}
                aria-hidden="true"
              />
              <span className={`
                text-xs font-medium leading-tight
                ${isActive ? 'font-semibold' : ''}
              `}>
                {tab.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div 
                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-teal-600 rounded-full"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Screen reader announcement for active tab */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite"
        aria-atomic="true"
      >
        {`Current page: ${tabs[activeIndex]?.label || 'Unknown'}`}
      </div>
    </nav>
  );
}