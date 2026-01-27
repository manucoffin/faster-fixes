"use client";

import { motion } from "framer-motion";
import React from "react";

interface AnimatedTextProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedText({
  children,
  className = "",
}: AnimatedTextProps) {
  return (
    <motion.div
      className={`relative inline-block ${className}`}
      whileHover="hover"
      initial="initial"
    >
      {children}
      <motion.span
        className="bg-primary absolute bottom-0 left-0 h-0.5"
        style={{ width: "100%", transformOrigin: "left" }}
        variants={{
          initial: { scaleX: 0 },
          hover: { scaleX: 1 },
        }}
        transition={{
          duration: 0.3,
          ease: [0.33, 0.66, 0.66, 1],
        }}
      />
    </motion.div>
  );
}
