import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

const COLORS = [
  'rgba(37, 99, 235,', // primary blue
  'rgba(20, 184, 166,', // aqua teal
  'rgba(139, 92, 246,', // soft violet
  'rgba(148, 163, 184,', // slate
];

/**
 * Very tiny drifting particles rendered behind all page content
 * (sits at z-index -1 next to the ambient blobs).
 */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let raf = 0;

    const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

    const seed = () => {
      const count = Math.max(40, Math.min(140, Math.round((width * height) / 12000)));
      particles = Array.from({ length: count }, () => {
        const big = Math.random() < 0.15;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: randomBetween(-0.16, 0.16),
          vy: randomBetween(-0.14, 0.14),
          radius: big ? randomBetween(1.6, 2.2) : randomBetween(0.6, 1.3),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: randomBetween(0.25, 0.7),
          twinkleSpeed: randomBetween(0.004, 0.012),
          twinklePhase: Math.random() * Math.PI * 2,
        };
      });
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        if (!reduced) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -4) p.x = width + 4;
          else if (p.x > width + 4) p.x = -4;
          if (p.y < -4) p.y = height + 4;
          else if (p.y > height + 4) p.y = -4;
        }

        const twinkle = reduced
          ? 1
          : 0.72 + 0.28 * Math.sin(time * p.twinkleSpeed + p.twinklePhase);

        ctx.beginPath();
        ctx.fillStyle = `${p.color} ${(p.alpha * twinkle).toFixed(3)})`;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = window.requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[-1]"
      aria-hidden="true"
    />
  );
}
