
import { PlanBanner } from "@/components/PlanBanner";
import { ProfileSection } from "@/components/dashboard/ProfileSection";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 bg-white shadow-sm border-b border-gray-200">
        <div className="text-2xl font-bold text-primary">
          Victure Healthcare Solutions
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              2
            </span>
          </Button>
          <div className="h-8 border-r border-gray-200"></div>
          <ProfileSection />
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6">
        <PlanBanner />
        <div className="mt-4">
          {children}
        </div>
      </main>
    </div>
  );
}
