
'use client';

import React, { useRef, useEffect, memo } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  velocity: { x: number; y: number };
}

// Memoize the component to prevent unnecessary re-renders
export const TechParticles = memo(({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    
    // Set up the canvas with the right pixel ratio for crisp rendering
    const setupCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      const rect = parent.getBoundingClientRect();
      
      // Logical size matches the element size
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Drastically reduce particle count on mobile and for users who prefer reduced motion
      initParticles();
    };
    
    const initParticles = () => {
      const isMobile = window.innerWidth < 768;
      
      // Drastically reduce particles for better performance
      const maxParticles = prefersReducedMotion ? 15 : (isMobile ? 20 : 40);
      
      particles.current = [];
      for (let i = 0; i < maxParticles; i++) {
        particles.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.3, // Smaller particles
          color: getRandomColor(),
          velocity: {
            x: (Math.random() - 0.5) * 0.1, // Much slower movement
            y: (Math.random() - 0.5) * 0.1
          }
        });
      }
    };
    
    const getRandomColor = () => {
      const colors = ['#3b82f660', '#60a5fa60', '#93c5fd60', '#a5b4fc60', '#ddd6fe60'];
      return colors[Math.floor(Math.random() * colors.length)];
    };
    
    const drawParticles = (time: number) => {
      if (!ctx || !canvas) return;
      
      // Skip frames for better performance, especially on mobile
      // Aim for ~15fps for particles instead of 60fps
      if (time - lastTimeRef.current < 66) { // ~15fps
        animationRef.current = requestAnimationFrame(drawParticles);
        return;
      }
      
      lastTimeRef.current = time;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Low connection threshold for better performance
      const maxConnections = prefersReducedMotion ? 5 : 10;
      const connectionDistance = prefersReducedMotion ? 60 : 80;
      let connectionCount = 0;
      
      // Draw particles and minimal connections
      particles.current.forEach((particle, i) => {
        // Update position with reduced calculations
        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;
        
        // Simple boundary checks
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        
        // Draw only a very limited number of connections
        if (connectionCount < maxConnections) {
          for (let j = i + 1; j < particles.current.length && connectionCount < maxConnections; j++) {
            const dx = particles.current[i].x - particles.current[j].x;
            const dy = particles.current[i].y - particles.current[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < connectionDistance) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(100, 120, 255, ${0.05 * (1 - distance / connectionDistance)})`;
              ctx.lineWidth = 0.2;
              ctx.moveTo(particles.current[i].x, particles.current[i].y);
              ctx.lineTo(particles.current[j].x, particles.current[j].y);
              ctx.stroke();
              connectionCount++;
            }
          }
        }
      });
      
      animationRef.current = requestAnimationFrame(drawParticles);
    };
    
    // Set up debounced resize handler
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(setupCanvas, 300);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Initial setup
    setupCanvas();
    
    // Start animation with requestAnimationFrame
    animationRef.current = requestAnimationFrame(drawParticles);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(resizeTimeout);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity: 0.15 }} // Further reduced opacity for better performance
    />
  );
});

TechParticles.displayName = 'TechParticles';
