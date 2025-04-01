
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface TabsNavigationProps {
  tabs: Array<{id: string, label: string}>;
  activeTab: string;
  onChange: (value: string) => void;
}

export function TabsNavigation({ tabs, activeTab, onChange }: TabsNavigationProps) {
  return (
    <div className="mb-6 border-b">
      <Tabs value={activeTab} onValueChange={onChange}>
        <TabsList className="bg-background mb-0">
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
