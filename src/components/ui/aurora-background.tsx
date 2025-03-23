
"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode, useEffect, useState, memo } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

// Lower quality aurora for mobile devices
const MobileAurora = memo(({ className }: { className?: string }) => (
  <div className={cn(
    "absolute inset-0 opacity-30 bg-gradient-to-r from-blue-500/20 to-purple-500/20",
    className
  )}>
    <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
  </div>
));

MobileAurora.displayName = 'MobileAurora';

// Full quality aurora for desktop
const DesktopAurora = memo(({ className, showRadialGradient }: { className?: string, showRadialGradient?: boolean }) => (
  <div className={cn(
    `absolute inset-0 overflow-hidden opacity-50`,
    className
  )}>
    <div
      className={cn(
        `[--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]
        [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)]
        [--aurora:repeating-linear-gradient(100deg,var(--blue-500)_10%,var(--indigo-300)_15%,var(--blue-300)_20%,var(--violet-200)_25%,var(--blue-400)_30%)]
        [background-image:var(--white-gradient),var(--aurora)]
        dark:[background-image:var(--dark-gradient),var(--aurora)]
        [background-size:300%,_200%]
        [background-position:50%_50%,50%_50%]
        filter blur-[10px] invert dark:invert-0
        after:content-[""] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
        after:dark:[background-image:var(--dark-gradient),var(--aurora)]
        after:[background-size:200%,_100%] 
        after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
        pointer-events-none
        absolute -inset-[10px] will-change-transform`,
        showRadialGradient &&
          `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`
      )}
    ></div>
  </div>
));

DesktopAurora.displayName = 'DesktopAurora';

export const AuroraBackground = memo(({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkMobile, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <main>
      <div
        className={cn(
          "relative flex flex-col h-[100vh] items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-slate-950 transition-bg",
          className
        )}
        {...props}
      >
        {isMobile ? (
          <MobileAurora />
        ) : (
          <DesktopAurora showRadialGradient={showRadialGradient} />
        )}
        {children}
      </div>
    </main>
  );
});

AuroraBackground.displayName = 'AuroraBackground';
