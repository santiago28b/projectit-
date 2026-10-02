"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { HERO } from "@/client/components/landing/landingCopy";
import { Button } from "@/client/components/ui/button";
import { cn } from "@/client/lib/utils";

type Side = "looking" | "hiring" | null;

export function LandingHero({
  isPending,
  onLooking,
  onHiring,
  onGuest,
}: {
  isPending: boolean;
  onLooking: () => void;
  onHiring: () => void;
  onGuest: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<Side>(null);

  const looking = active === "looking";
  const hiring = active === "hiring";

  return (
    <section
      className="relative isolate min-h-[min(92vh,860px)] overflow-hidden"
      onMouseLeave={() => setActive(null)}
    >
      {/* Base split — C2 soft washes, no illustrations */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[linear-gradient(115deg,var(--color-candidate-soft)_0%,color-mix(in_oklab,var(--color-candidate-soft)_55%,white)_42%,color-mix(in_oklab,var(--color-company-soft)_55%,white)_58%,var(--color-company-soft)_100%)]"
      />

      {/* Expanding side signals */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 -z-10 origin-left bg-gradient-to-r from-candidate/25 via-candidate/12 to-transparent"
        animate={
          reduceMotion
            ? { width: looking ? "72%" : "38%", opacity: looking ? 1 : 0.55 }
            : {
                width: looking ? "78%" : hiring ? "22%" : "42%",
                opacity: looking ? 1 : hiring ? 0.25 : 0.65,
              }
        }
        transition={{ type: "spring", stiffness: 220, damping: 28 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 origin-right bg-gradient-to-l from-company/25 via-company/12 to-transparent"
        animate={
          reduceMotion
            ? { width: hiring ? "72%" : "38%", opacity: hiring ? 1 : 0.55 }
            : {
                width: hiring ? "78%" : looking ? "22%" : "42%",
                opacity: hiring ? 1 : looking ? 0.25 : 0.65,
              }
        }
        transition={{ type: "spring", stiffness: 220, damping: 28 }}
      />

      {/* Soft diagonal sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          background:
            "linear-gradient(155deg, transparent 35%, color-mix(in_oklab, white 70%, transparent) 50%, transparent 65%)",
        }}
      />

      <div className="relative mx-auto grid min-h-[min(92vh,860px)] max-w-6xl grid-cols-1 items-center gap-8 px-6 py-16 lg:grid-cols-[1fr_auto_1fr] lg:gap-4 lg:py-20">
        {/* Looking — left */}
        <motion.div
          className={cn(
            "relative z-10 flex flex-col items-center justify-center gap-4 rounded-3xl px-4 py-10 text-center transition-shadow lg:items-start lg:text-left",
            looking && "bg-white/25 shadow-lg ring-1 ring-candidate/20 backdrop-blur-[2px]",
          )}
          onMouseEnter={() => setActive("looking")}
          onFocusCapture={() => setActive("looking")}
          animate={
            reduceMotion
              ? undefined
              : { scale: looking ? 1.03 : hiring ? 0.97 : 1 }
          }
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          <p
            className={cn(
              "text-sm font-semibold uppercase tracking-[0.18em] transition-colors",
              looking ? "text-candidate" : "text-candidate/70",
            )}
          >
            Candidates
          </p>
          <p className="max-w-xs text-sm text-zinc-600 lg:text-base">
            Show what you can do — short Projects, a Walkthrough, real Evidence.
          </p>
          <motion.div
            animate={
              reduceMotion
                ? undefined
                : { scale: looking ? 1.08 : 1, y: looking ? -2 : 0 }
            }
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <Button
              type="button"
              size="lg"
              disabled={isPending}
              onClick={onLooking}
              className={cn(
                "h-12 px-7 text-base shadow-md transition-shadow",
                "bg-candidate text-white hover:bg-candidate/90",
                looking && "shadow-candidate/30 shadow-xl",
              )}
            >
              I&apos;m Looking
            </Button>
          </motion.div>
        </motion.div>

        {/* Center glass — brand + small browse */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative z-20 mx-auto flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border border-white/70 bg-white/55 px-8 py-10 text-center shadow-xl shadow-zinc-900/5 backdrop-blur-xl ring-1 ring-platform/10"
          onMouseEnter={() => setActive(null)}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-platform">
            {HERO.brand}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Project It
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600">
            {HERO.pitch}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={onGuest}
            className="border-platform/30 bg-white/80 text-platform hover:bg-platform-soft hover:text-platform"
          >
            Browse Projects
          </Button>
        </motion.div>

        {/* Hiring — right */}
        <motion.div
          className={cn(
            "relative z-10 flex flex-col items-center justify-center gap-4 rounded-3xl px-4 py-10 text-center transition-shadow lg:items-end lg:text-right",
            hiring && "bg-white/25 shadow-lg ring-1 ring-company/20 backdrop-blur-[2px]",
          )}
          onMouseEnter={() => setActive("hiring")}
          onFocusCapture={() => setActive("hiring")}
          animate={
            reduceMotion
              ? undefined
              : { scale: hiring ? 1.03 : looking ? 0.97 : 1 }
          }
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          <p
            className={cn(
              "text-sm font-semibold uppercase tracking-[0.18em] transition-colors",
              hiring ? "text-company" : "text-company/70",
            )}
          >
            Companies
          </p>
          <p className="max-w-xs text-sm text-zinc-600 lg:text-base">
            Post Projects, review Submissions, and Shortlist with Evidence — not
            resume guesswork.
          </p>
          <motion.div
            animate={
              reduceMotion
                ? undefined
                : { scale: hiring ? 1.08 : 1, y: hiring ? -2 : 0 }
            }
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <Button
              type="button"
              size="lg"
              disabled={isPending}
              onClick={onHiring}
              className={cn(
                "h-12 px-7 text-base shadow-md transition-shadow",
                "bg-company text-white hover:bg-company/90",
                hiring && "shadow-company/30 shadow-xl",
              )}
            >
              I&apos;m Hiring
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <p className="pointer-events-none absolute bottom-6 left-1/2 hidden w-full max-w-lg -translate-x-1/2 px-6 text-center text-sm text-zinc-500 lg:block">
        {HERO.headline}
      </p>
    </section>
  );
}
