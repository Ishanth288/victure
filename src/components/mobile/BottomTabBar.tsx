import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, Users, FileText, BarChart3, Plus } from 'lucide-react';
import { hapticFeedback } from '@/utils/mobileUtils';

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
    label: "Scripts", 
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
  const [indicatorPosition, setIndicatorPosition] = useState(0);
  const [indicatorWidth, setIndicatorWidth] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Update active index when location changes
  useEffect(() => {
    const currentIndex = tabs.findIndex(tab => {
      if (tab.path === "/mobile" && location.pathname === "/mobile") {
        return true;
      }
      return location.pathname.startsWith(tab.path) && tab.path !== "/mobile";
    });
    
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname]);

  // Update indicator position when active index changes
  useEffect(() => {
    const activeTab = tabRefs.current[activeIndex];
    if (activeTab) {
      const tabRect = activeTab.getBoundingClientRect();
      const containerRect = activeTab.parentElement?.getBoundingClientRect();
      
      if (containerRect) {
        const position = tabRect.left - containerRect.left + (tabRect.width / 2);
        setIndicatorPosition(position);
        setIndicatorWidth(tabRect.width * 0.6); // 60% of tab width for a sleek look
      }
    }
  }, [activeIndex]);

  const handleTabClick = useCallback(async (tab: TabItem, index: number) => {
    // Provide haptic feedback for native apps
    await hapticFeedback('light');
    
    setActiveIndex(index);
    navigate(tab.path);
  }, [navigate]);

  if (location.pathname.includes('/auth') || 
      location.pathname.includes('/scanner') ||
      location.pathname.includes('/deletion-history')) {
    return null;
  }

  return (
    <>
      {/* Background overlay to prevent content from showing behind the tab bar */}
      <div className="h-20 md:h-0" />
      
      {/* Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Background with blur effect */}
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700" />
        
        {/* Safe area padding */}
        <div className="safe-area-bottom">
          <div className="relative px-4 py-2">
            {/* Animated indicator */}
            <div 
              className="absolute top-1 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
              style={{
                left: indicatorPosition - indicatorWidth / 2,
                width: indicatorWidth,
              }}
            />
            
            {/* Tab buttons */}
            <div className="flex justify-around items-center">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = index === activeIndex;
                
                return (
                  <button
                    key={tab.path}
                    ref={(el) => (tabRefs.current[index] = el)}
                    onClick={() => handleTabClick(tab, index)}
                    className={`
                      flex-1 flex flex-col items-center justify-center py-2 px-1 relative
                      transition-all duration-200 ease-out touch-target
                      ${isActive ? 'scale-105' : 'scale-100'}
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-50 rounded-lg
                    `}
                    aria-label={tab.description}
                    role="tab"
                    aria-selected={isActive}
                  >
                    {/* Icon container with background animation */}
                    <div 
                      className={`
                        relative p-1.5 rounded-xl transition-all duration-200 ease-out
                        ${isActive 
                          ? 'bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 shadow-md' 
                          : 'bg-transparent'
                        }
                      `}
                    >
                      <Icon 
                        className={`
                          w-5 h-5 transition-all duration-200 ease-out
                          ${isActive 
                            ? 'text-blue-600 dark:text-blue-400 scale-110' 
                            : 'text-gray-600 dark:text-gray-400 scale-100'
                          }
                        `} 
                      />
                      
                      {/* Active dot indicator */}
                      {isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-pulse-apple" />
                      )}
                    </div>
                    
                    {/* Label */}
                    <span 
                      className={`
                        text-xs font-medium mt-1 transition-all duration-200 ease-out
                        ${isActive 
                          ? 'text-gray-900 dark:text-white scale-105 font-semibold' 
                          : 'text-gray-600 dark:text-gray-400 scale-100'
                        }
                      `}
                    >
                      {tab.label}
                    </span>
                    
                    {/* Ripple effect on tap (visible on active state) */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 animate-fade-in" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Action Button (optional - can be enabled for quick scanner access) */}
      {location.pathname === '/mobile' && (
        <div className="fixed bottom-24 right-6 z-40 md:hidden">
          <button
            onClick={async () => {
              await hapticFeedback('medium');
              navigate('/mobile/inventory'); // Or scanner if available
            }}
            className="
              w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-2xl
              flex items-center justify-center transform transition-all duration-200 ease-out
              hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30
            "
            aria-label="Quick scan medicine"
          >
            <Plus className="w-6 h-6 text-white" />
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
          </button>
        </div>
      )}
    </>
  );
}