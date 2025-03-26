
import React, { useRef, useState, useEffect, memo } from "react";
import { useScroll, useTransform, m, MotionValue } from "framer-motion";

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
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  const mobileScale = [0.7, 0.9];
  const desktopScale = [1.05, 1];

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setShouldReduceMotion(prefersReducedMotion);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    
    // Use passive event listener for better scroll performance
    const handleResize = () => {
      requestAnimationFrame(() => {
        checkMobile();
      });
    };
    
    window.addEventListener("resize", handleResize, { passive: true });
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const scaleDimensions = () => isMobile ? mobileScale : desktopScale;

  // Simplified transform calculations for better performance
  const rotate = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      className="h-[60rem] md:h-[80rem] flex items-center justify-center relative p-2 md:p-20 will-change-transform"
      ref={containerRef}
      style={{ 
        contain: 'content', // Improve performance by creating a new stacking context
        contentVisibility: 'auto', // Improves rendering performance
      }}
    >
      <div
        className="py-10 md:py-40 w-full relative"
        style={{
          perspective: shouldReduceMotion ? "none" : "1000px",
          WebkitPerspective: shouldReduceMotion ? "none" : "1000px",
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
          : "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042",
        transform: shouldReduceMotion ? "none" : undefined,
        willChange: "transform", // Hint for browser optimization
        WebkitFontSmoothing: "subpixel-antialiased", // Improve text rendering
        backfaceVisibility: "hidden", // Reduce composite layers
        transformStyle: "preserve-3d", // Better 3D rendering
      }}
      className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full border-4 border-[#6C6C6C] p-2 md:p-6 bg-[#222222] rounded-[30px] shadow-2xl will-change-transform"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 md:rounded-2xl md:p-4">
        {children}
      </div>
    </m.div>
  );
});

ContainerScroll.displayName = 'ContainerScroll';
Header.displayName = 'ScrollHeader';
Card.displayName = 'ScrollCard';
