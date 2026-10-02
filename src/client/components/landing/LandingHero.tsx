"use client";

import { motion, useReducedMotion } from "motion/react";

import { HERO } from "@/client/components/landing/landingCopy";
import { Button } from "@/client/components/ui/button";

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

  const item = (delay: number) =>
    reduceMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease: "easeOut" as const },
        };

  return (
    <section className="relative isolate overflow-hidden px-6 pb-16 pt-20 sm:pt-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 20%, var(--color-candidate-soft), transparent), radial-gradient(ellipse 70% 50% at 80% 10%, var(--color-company-soft), transparent), radial-gradient(ellipse 90% 70% at 50% 100%, var(--color-platform-soft), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%636366' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="mx-auto flex max-w-3xl flex-col items-start gap-8">
        <motion.p
          {...item(0)}
          className="text-sm font-semibold uppercase tracking-[0.2em] text-platform"
        >
          {HERO.brand}
        </motion.p>
        <motion.h1
          {...item(0.08)}
          className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl sm:leading-[1.1]"
        >
          {HERO.headline}
        </motion.h1>
        <motion.p
          {...item(0.16)}
          className="max-w-xl text-lg leading-relaxed text-zinc-600"
        >
          {HERO.pitch}
        </motion.p>
        <motion.div
          {...item(0.24)}
          className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap"
        >
          <Button
            type="button"
            size="lg"
            disabled={isPending}
            onClick={onLooking}
            className="bg-candidate text-white hover:bg-candidate/90"
          >
            I&apos;m Looking for Opportunities
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={isPending}
            onClick={onHiring}
            className="bg-company text-white hover:bg-company/90"
          >
            I&apos;m Hiring
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            disabled={isPending}
            onClick={onGuest}
          >
            Browse as Guest
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
