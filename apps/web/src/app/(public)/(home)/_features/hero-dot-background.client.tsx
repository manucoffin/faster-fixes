"use client";

import { cn } from "@workspace/ui/lib/utils";
import { useCallback, useId, useRef, useState } from "react";

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
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: -1000, y: -1000 });
  }, []);

  const patternId = `${id}-dot-pattern`;
  const maskGradientId = `${id}-dot-mask-gradient`;
  const maskId = `${id}-dot-mask`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("relative overflow-hidden", className)}
    >
      <svg
        aria-hidden="true"
        className="text-muted-foreground/10 pointer-events-none absolute inset-0 z-0 h-full w-full"
      >
        <defs>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
          >
            <text
              x={spacing / 2}
              y={spacing / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={fontSize}
              fontFamily="monospace"
              fill="currentColor"
            >
              /
            </text>
          </pattern>
          <radialGradient id={maskGradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </radialGradient>
          <mask id={maskId}>
            <circle
              cx={mousePos.x}
              cy={mousePos.y}
              r={highlightRadius}
              fill={`url(#${maskGradientId})`}
            />
          </mask>
        </defs>
        {/* Base dots */}
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        {/* Highlighted dots near cursor */}
        <rect
          width="100%"
          height="100%"
          fill={`url(#${patternId})`}
          mask={`url(#${maskId})`}
          className="text-muted-foreground/60"
        />
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
