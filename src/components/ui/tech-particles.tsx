
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
  const lastFrameTimeRef = useRef<number>(0);
  const throttleFrameRate = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      const devicePixelRatio = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      
      // Set logical size
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Clear and redraw at the new resolution
      ctx.scale(devicePixelRatio, devicePixelRatio);
      
      // Significantly reduce the number of particles
      initParticles();
    };
    
    const initParticles = () => {
      particles.current = [];
      
      // Drastically reduce particle count for better performance
      const density = window.innerWidth < 768 ? 40000 : 30000;
      const particleCount = Math.min(50, Math.floor((canvas.width * canvas.height) / density));
      
      for (let i = 0; i < particleCount; i++) {
        particles.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.5, // Smaller particles
          color: getRandomColor(),
          velocity: {
            x: (Math.random() - 0.5) * 0.15, // Slower movement
            y: (Math.random() - 0.5) * 0.15
          }
        });
      }
    };
    
    const getRandomColor = () => {
      const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#a5b4fc', '#ddd6fe'];
      return colors[Math.floor(Math.random() * colors.length)];
    };
    
    const drawParticles = (timestamp: number) => {
      if (!ctx || !canvas) return;
      
      // Frame rate limiting for better performance
      if (throttleFrameRate.current) {
        // Target 30fps for particles (33.33ms between frames)
        const elapsed = timestamp - lastFrameTimeRef.current;
        if (elapsed < 33.33) {
          animationRef.current = requestAnimationFrame(drawParticles);
          return;
        }
        lastFrameTimeRef.current = timestamp;
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.current.forEach(particle => {
        // Update position
        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;
        
        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });
      
      // Only draw connections every 3rd frame
      const currentFrame = Math.floor(timestamp / 33.33) % 3;
      
      if (currentFrame === 0) {
        // Limit the total number of connections to improve performance
        const maxConnections = 30;
        let connectionCount = 0;
        
        // Calculate connections with a maximum distance threshold
        const maxDistance = 80; // Reduced connection distance
        
        for (let i = 0; i < particles.current.length && connectionCount < maxConnections; i++) {
          for (let j = i + 1; j < particles.current.length && connectionCount < maxConnections; j++) {
            const dx = particles.current[i].x - particles.current[j].x;
            const dy = particles.current[i].y - particles.current[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < maxDistance) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(100, 120, 255, ${0.1 * (1 - distance / maxDistance)})`;
              ctx.lineWidth = 0.3;
              ctx.moveTo(particles.current[i].x, particles.current[i].y);
              ctx.lineTo(particles.current[j].x, particles.current[j].y);
              ctx.stroke();
              connectionCount++;
            }
          }
        }
      }
      
      animationRef.current = requestAnimationFrame(drawParticles);
    };
    
    // Implement a debounced resize handler
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 200);
    };
    
    window.addEventListener('resize', handleResize);
    resizeCanvas();
    
    // Start animation
    animationRef.current = requestAnimationFrame(drawParticles);
    
    // Check if we should use reduced animation quality
    const checkPerformance = () => {
      // Enable throttling on mobile or low-power devices
      throttleFrameRate.current = window.innerWidth < 1024;
    };
    checkPerformance();
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(resizeTimer);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity: 0.2 }} // Reduced opacity for better performance
    />
  );
});

TechParticles.displayName = 'TechParticles';
