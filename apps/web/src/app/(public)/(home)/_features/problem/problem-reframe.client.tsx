"use client";

import { motion } from "motion/react";

export function ProblemReframe() {
  return (
    <div className="mx-auto max-w-2xl text-center text-2xl md:text-4xl">
      <motion.p
        className="font-medium leading-relaxed"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <span className="bg-primary/30 rounded px-2 py-0.5">
          Clients and developers don&apos;t speak the same language.
        </span>
      </motion.p>
      <motion.p
        className="text-muted-foreground mt-6 leading-relaxed"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        In small teams without a PM to bridge it, that translation falls
        entirely on the developer. On top of the actual work.
      </motion.p>
    </div>
  );
}
