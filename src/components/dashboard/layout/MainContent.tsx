
import { useIsMobile } from "@/hooks/use-mobile";
import { PlanBanner } from "@/components/PlanBanner";
import { ProfileSection } from "@/components/dashboard/ProfileSection";

interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 border-b bg-white shadow-sm">
        <div className="flex-1"></div>
        <div className="text-2xl font-bold text-neutral-900 flex-1 text-center flex justify-center items-center">
          <span className="transition-opacity duration-300 whitespace-nowrap">
            {isMobile ? "Victure" : "Victure Healthcare Solutions"}
          </span>
        </div>
        <div className="flex-1 flex justify-end">
          <ProfileSection />
        </div>
      </header>
      
      <div className="flex-1">
        <PlanBanner />
        <div className={isMobile ? "pb-16" : ""}>
          {children}
        </div>
      </div>
    </div>
  );
}
