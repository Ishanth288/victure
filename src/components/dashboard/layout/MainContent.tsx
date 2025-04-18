
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlanBanner } from "@/components/PlanBanner";
import { ProfileSection } from "@/components/dashboard/ProfileSection";

interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 border-b bg-white shadow-sm">
        <div className="text-2xl font-bold text-neutral-900">
          Victure Healthcare Solutions
        </div>
        <ProfileSection />
      </header>
      
      <main className="p-4 md:p-6 flex-1 overflow-auto">
        <PlanBanner />
        {children}
      </main>
    </div>
  );
}
