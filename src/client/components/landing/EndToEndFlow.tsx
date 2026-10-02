"use client";

import { motion } from "motion/react";

import { useReducedMotionSafe } from "@/client/lib/useReducedMotionSafe";

import { END_TO_END } from "@/client/components/landing/landingCopy";

export function EndToEndFlow() {
  const reduceMotion = useReducedMotionSafe();

  return (
    <section
      aria-labelledby="end-to-end"
      className="border-y border-zinc-200/80 bg-white/70 px-6 py-16 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-sm font-medium uppercase tracking-wide text-platform">
          End-to-end
        </p>
        <h2
          id="end-to-end"
          className="mt-2 text-center text-2xl font-semibold text-zinc-900"
        >
          From Job to interview shortlist
        </h2>

        <ol className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-2">
          {END_TO_END.map((step, index) => (
            <li key={step} className="flex items-center gap-2 sm:contents">
              <motion.div
                initial={
                  reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }
                }
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.4,
                  delay: reduceMotion ? 0 : index * 0.07,
                  ease: "easeOut",
                }}
                className="flex-1 rounded-full bg-platform-soft px-4 py-2.5 text-center text-sm font-medium text-platform sm:flex-none"
              >
                {step}
              </motion.div>
              {index < END_TO_END.length - 1 && (
                <span
                  aria-hidden
                  className="hidden text-zinc-300 sm:inline"
                >
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
