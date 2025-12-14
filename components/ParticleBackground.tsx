import React, { useEffect, useRef } from 'react';
import { useApp } from '../AppContext';

export const ParticleBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { darkMode } = useApp();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let animationFrameId: number;

    // Configuration
    const particleCountRef = { current: 80 };
    const connectionDist = 120;
    
    // Resize handler
    const handleResize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        // Adjust particle count based on screen size (density)
        particleCountRef.current = Math.floor((width * height) / 15000);
        initParticles();
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        // Particles are white/transparent in dark mode, dark/transparent in light mode
        ctx.fillStyle = darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
        ctx.fill();
      }
    }

    const initParticles = () => {
        particles = [];
        for (let i = 0; i < particleCountRef.current; i++) {
            particles.push(new Particle());
        }
    };

    const animate = () => {
        ctx.clearRect(0, 0, width, height);
        
        // Render
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.update();
            p.draw();

            // Connections
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.hypot(dx, dy);

                if (dist < connectionDist) {
                    ctx.beginPath();
                    const opacity = 1 - dist / connectionDist;
                    // Arknights Primary Blue #23ade5 for connections in dark mode
                    ctx.strokeStyle = darkMode 
                        ? `rgba(35, 173, 229, ${opacity * 0.3})` 
                        : `rgba(100, 116, 139, ${opacity * 0.2})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        
        animationFrameId = requestAnimationFrame(animate);
    };

    // Initial setup
    handleResize();
    animate();

    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
    };
  }, [darkMode]);

  return (
    <canvas 
        ref={canvasRef} 
        className={`absolute inset-0 w-full h-full pointer-events-none z-0 ${className}`} 
    />
  );
};