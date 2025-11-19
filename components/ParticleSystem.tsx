import React, { useEffect, useRef } from 'react';

interface ParticleSystemProps {
  trigger: number; // Increment this to trigger explosion
  type: 'hit' | 'heal' | 'spark';
  x: number;
  y: number;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ trigger, type, x, y }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (trigger === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to full window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles: any[] = [];
    const particleCount = type === 'hit' ? 50 : 30;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1.0,
        color: type === 'hit' 
          ? `hsl(${Math.random() * 60 + 10}, 100%, 50%)` // Fire colors
          : `hsl(${Math.random() * 60 + 180}, 100%, 70%)`, // Blue/Spark
        size: Math.random() * 5 + 2
      });
    }

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach(p => {
        if (p.life > 0) {
          active = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.5; // Gravity
          p.life -= 0.05;
          
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (active) {
        animationId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [trigger, type, x, y]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-40"
    />
  );
};

export default ParticleSystem;