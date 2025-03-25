
import React, { useRef, useState, useEffect, memo } from "react";
import { useScroll, useTransform, m, MotionValue } from "framer-motion";

// Optimize the ContainerScroll component
export const ContainerScroll = memo(({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  const [isMobile, setIsMobile] = useState(false);

  // Cache static values
  const mobileScale = [0.7, 0.9];
  const desktopScale = [1.05, 1];

  // Optimize resize handler with debounce
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkMobile, 200);
    };
    
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Memoize transform calculations
  const scaleDimensions = () => isMobile ? mobileScale : desktopScale;
  
  // Optimize transform calculations with clamping and reduced motion
  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0], { clamp: true });
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions(), { clamp: true });
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100], { clamp: true });

  // Add shouldReduceMotion check for accessibility and performance
  const shouldReduceMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ).current;

  return (
    <div
      className="h-[60rem] md:h-[80rem] flex items-center justify-center relative p-2 md:p-20 will-change-transform"
      ref={containerRef}
    >
      <div
        className="py-10 md:py-40 w-full relative"
        style={{
          perspective: shouldReduceMotion ? "none" : "1000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card 
          rotate={rotate} 
          translate={translate} 
          scale={scale}
          shouldReduceMotion={shouldReduceMotion}
        >
          {children}
        </Card>
      </div>
    </div>
  );
});

// Optimize the Header component with memoization
const Header = memo(({ translate, titleComponent }: { 
  translate: MotionValue<number>; 
  titleComponent: React.ReactNode | string;
}) => {
  return (
    <m.div
      style={{
        translateY: translate,
      }}
      className="div max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </m.div>
  );
});

// Optimize the Card component with memoization
const Card = memo(({
  rotate,
  scale,
  translate,
  children,
  shouldReduceMotion,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
  shouldReduceMotion: boolean;
}) => {
  return (
    <m.div
      style={{
        rotateX: shouldReduceMotion ? 0 : rotate,
        scale,
        boxShadow: shouldReduceMotion 
          ? "0 0 #0000004d, 0 9px 20px #0000004a" 
          : "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
        transform: shouldReduceMotion ? "none" : undefined,
      }}
      className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full border-4 border-[#6C6C6C] p-2 md:p-6 bg-[#222222] rounded-[30px] shadow-2xl will-change-transform"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 md:rounded-2xl md:p-4">
        {children}
      </div>
    </m.div>
  );
});

// Add display names for React DevTools
ContainerScroll.displayName = 'ContainerScroll';
Header.displayName = 'ScrollHeader';
Card.displayName = 'ScrollCard';
