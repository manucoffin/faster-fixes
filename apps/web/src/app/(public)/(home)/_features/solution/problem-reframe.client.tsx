"use client";

import { motion } from "motion/react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
} as const;

export function ProblemReframe() {
  return (
    <div className="mx-auto max-w-2xl text-left text-2xl leading-relaxed font-medium md:text-4xl">
      <motion.p {...fadeUp} transition={{ duration: 0.6 }}>
        Clients and developers don&apos;t speak the same language.
      </motion.p>

      <motion.p
        className="mt-6"
        {...fadeUp}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <span className="bg-primary/30 rounded px-2 py-0.5">
          FasterFixes makes the translation automatic.
        </span>
      </motion.p>

      <motion.p
        className="mt-6"
        {...fadeUp}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        It connects your coding agent to client feedback via MCP and lets it fix
        issues for you.
      </motion.p>

      <motion.p
        className="mt-6"
        {...fadeUp}
        transition={{ duration: 0.6, delay: 0.65 }}
      >
        Works with React and any coding agent.
      </motion.p>
    </div>
  );
}
