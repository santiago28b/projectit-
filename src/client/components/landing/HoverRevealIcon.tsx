"use client";

import { AnimatePresence, motion } from "motion/react";

import { useReducedMotionSafe } from "@/client/lib/useReducedMotionSafe";
import { useState } from "react";

import { cn } from "@/client/lib/utils";
import type { RevealItem } from "@/client/components/landing/landingCopy";

type Accent = "candidate" | "company" | "platform" | "ai";

const ACCENT: Record<
  Accent,
  { ring: string; soft: string; text: string; icon: string }
> = {
  candidate: {
    ring: "focus-visible:ring-candidate",
    soft: "bg-candidate-soft",
    text: "text-candidate",
    icon: "text-candidate",
  },
  company: {
    ring: "focus-visible:ring-company",
    soft: "bg-company-soft",
    text: "text-company",
    icon: "text-company",
  },
  platform: {
    ring: "focus-visible:ring-platform",
    soft: "bg-platform-soft",
    text: "text-platform",
    icon: "text-platform",
  },
  ai: {
    ring: "focus-visible:ring-ai",
    soft: "bg-ai-soft",
    text: "text-ai",
    icon: "text-ai",
  },
};

export function HoverRevealIcon({
  item,
  accent,
  open,
  onOpenChange,
}: {
  item: RevealItem;
  accent: Accent;
  /** Controlled open state (one open per column). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const reduceMotion = useReducedMotionSafe();
  const styles = ACCENT[accent];
  const Icon = item.icon;
  const [hovered, setHovered] = useState(false);
  const shown = open || hovered;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-expanded={shown}
        aria-controls={`reveal-${item.id}`}
        onClick={() => onOpenChange(!open)}
        onFocus={() => onOpenChange(true)}
        className={cn(
          "group flex w-full flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center outline-none transition-colors",
          "focus-visible:ring-2 focus-visible:ring-offset-2",
          styles.ring,
          shown && styles.soft,
        )}
      >
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-transform",
            styles.icon,
            shown && !reduceMotion && "scale-105",
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <span className={cn("text-xs font-semibold sm:text-sm", styles.text)}>
          {item.label}
        </span>
      </button>

      <AnimatePresence>
        {shown && (
          <motion.div
            id={`reveal-${item.id}`}
            role="tooltip"
            initial={
              reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.96 }
            }
            animate={
              reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }
            }
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-xl bg-white p-3 text-left shadow-lg ring-1 ring-black/8"
          >
            <p className="text-sm font-semibold text-zinc-900">{item.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">
              {item.detail}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
