"use client";

import { cn } from "@workspace/ui/lib/utils";
import { useCallback, useEffect, useRef } from "react";

interface HeroDotBackgroundProps {
  fontSize?: number;
  spacing?: number;
  highlightRadius?: number;
  className?: string;
  children?: React.ReactNode;
}

export function HeroDotBackground({
  fontSize = 8,
  spacing = 24,
  highlightRadius = 200,
  className,
  children,
}: HeroDotBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number>(0);
  const colorRef = useRef("rgb(150,150,150)");

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const { x: mx, y: my } = mousePosRef.current;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = colorRef.current;

    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;
    const rSq = highlightRadius * highlightRadius;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * spacing + spacing / 2;
        const y = row * spacing + spacing / 2;

        const dx = mx - x;
        const dy = my - y;
        const distSq = dx * dx + dy * dy;

        if (distSq < rSq) {
          const dist = Math.sqrt(distSq);
          const t = 1 - dist / highlightRadius;
          const easedT = t * t * (3 - 2 * t); // smoothstep

          ctx.save();
          ctx.globalAlpha = 0.05 + easedT * 0.25;
          ctx.translate(x, y);
          ctx.rotate(easedT * 0.7 * Math.atan2(dy, dx));
          ctx.fillText("/", 0, 0);
          ctx.restore();
        } else {
          ctx.globalAlpha = 0.05;
          ctx.fillText("/", x, y);
        }
      }
    }

    ctx.globalAlpha = 1;
  }, [fontSize, spacing, highlightRadius]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateColor = () => {
      colorRef.current = getComputedStyle(canvas).color;
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      updateColor();
      draw();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // Catch class-based theme toggles (e.g. next-themes)
    const mutationObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "class") {
          updateColor();
          draw();
          break;
        }
      }
    });
    mutationObserver.observe(document.documentElement, { attributes: true });

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onTheme = () => {
      updateColor();
      draw();
    };
    mq.addEventListener("change", onTheme);

    resize();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      mq.removeEventListener("change", onTheme);
    };
  }, [draw]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mousePosRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(draw);
      }
    },
    [draw],
  );

  const handleMouseLeave = useCallback(() => {
    mousePosRef.current = { x: -1000, y: -1000 };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("relative overflow-hidden", className)}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute inset-0 z-0"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
