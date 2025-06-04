import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, Users, Settings, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/utils/mobileUtils';
import { useMobileScanner } from '@/hooks/useMobileScanner';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  isSpecial?: boolean;
}

const tabs: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/mobile'
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    path: '/mobile/inventory'
  },
  {
    id: 'scanner',
    label: 'Scanner',
    icon: Camera,
    path: '#',
    isSpecial: true
  },
  {
    id: 'patients',
    label: 'Patients',
    icon: Users,
    path: '/mobile/patients'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/mobile/settings'
  }
];

export function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openScanner } = useMobileScanner();
  const [activeTab, setActiveTab] = useState('home');
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    // Determine active tab based on current path
    const currentTab = tabs.find(tab => tab.path === location.pathname);
    if (currentTab) {
      setActiveTab(currentTab.id);
      updateIndicator(currentTab.id);
    }
  }, [location.pathname]);

  const updateIndicator = (tabId: string) => {
    const tabElement = tabRefs.current[tabId];
    if (tabElement) {
      const { offsetLeft, offsetWidth } = tabElement;
      setIndicatorStyle({
        transform: `translateX(${offsetLeft}px)`,
        width: `${offsetWidth}px`,
      });
    }
  };

  const handleTabPress = async (tab: TabItem) => {
    await hapticFeedback('light');
    
    if (tab.isSpecial) {
      // Open camera scanner
      openScanner();
      return;
    }

    setActiveTab(tab.id);
    updateIndicator(tab.id);
    navigate(tab.path);
  };

  return (
    <>
      {/* Safe area spacer for home indicator */}
      <div className="h-safe-area-bottom bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/30 dark:border-gray-700/30"></div>
      
      {/* Main tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-md mx-auto">
          <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/30 dark:border-gray-700/30 safe-area-bottom">
            {/* Active indicator */}
            <div
              className="absolute top-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
              style={indicatorStyle}
            />
            
            {/* Tab buttons */}
            <div className="flex items-center justify-around px-4 py-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                
                if (tab.isSpecial) {
                  // Special floating action button
                  return (
                    <Button
                      key={tab.id}
                      ref={(el) => tabRefs.current[tab.id] = el}
                      onClick={() => handleTabPress(tab)}
                      className="relative w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-110 active:scale-95 transition-all duration-200 focus-ring mx-2"
                    >
                      <Icon className="w-6 h-6" />
                      
                      {/* Pulse effect */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 opacity-30 animate-pulse-apple"></div>
                    </Button>
                  );
                }

                return (
                  <Button
                    key={tab.id}
                    ref={(el) => tabRefs.current[tab.id] = el}
                    onClick={() => handleTabPress(tab)}
                    variant="ghost"
                    className={`flex flex-col items-center justify-center space-y-1 p-3 min-h-16 transition-all duration-200 focus-ring ${
                      isActive 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 transition-transform duration-200 ${
                      isActive ? 'scale-110' : 'scale-100'
                    }`} />
                    <span className={`text-caption-2 font-medium transition-all duration-200 ${
                      isActive ? 'opacity-100 scale-105' : 'opacity-70 scale-100'
                    }`}>
                      {tab.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}