"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { HoverRevealIcon } from "@/client/components/landing/HoverRevealIcon";
import {
  CANDIDATE_COLUMN,
  COMPANY_COLUMN,
  PLATFORM_HUB,
} from "@/client/components/landing/landingCopy";
import { cn } from "@/client/lib/utils";

function ColumnHeader({
  title,
  tagline,
  accentClass,
}: {
  title: string;
  tagline: string;
  accentClass: string;
}) {
  return (
    <header className="mb-6 space-y-1 text-center">
      <h3 className={cn("text-lg font-semibold", accentClass)}>{title}</h3>
      <p className="text-sm text-zinc-600">{tagline}</p>
    </header>
  );
}

export function ProductTriad() {
  const reduceMotion = useReducedMotion();
  const [openCandidate, setOpenCandidate] = useState<string | null>(null);
  const [openCompany, setOpenCompany] = useState<string | null>(null);
  const [openPlatform, setOpenPlatform] = useState<string | null>(null);

  const enter = (x: number) =>
    reduceMotion
      ? { opacity: 1, x: 0 }
      : { opacity: 0, x };

  return (
    <section
      aria-labelledby="how-it-works"
      className="relative overflow-hidden px-6 py-20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_left,_var(--color-candidate-soft),_transparent_55%),radial-gradient(ellipse_at_right,_var(--color-company-soft),_transparent_55%),radial-gradient(ellipse_at_center,_var(--color-platform-soft),_transparent_50%)]"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-platform">
            How it works
          </p>
          <h2
            id="how-it-works"
            className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900"
          >
            Candidates and Companies meet in the middle
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-zinc-600">
            Hover or tap an icon to see each step. Project It connects both
            sides with Projects, Walkthroughs, Evidence, and Matches.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
          <motion.div
            initial={enter(-28)}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-3xl bg-candidate-soft/60 px-4 py-8 ring-1 ring-candidate/10"
          >
            <ColumnHeader
              title={CANDIDATE_COLUMN.title}
              tagline={CANDIDATE_COLUMN.tagline}
              accentClass="text-candidate"
            />
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {CANDIDATE_COLUMN.steps.map((step) => (
                <li key={step.id}>
                  <HoverRevealIcon
                    item={step}
                    accent="candidate"
                    open={openCandidate === step.id}
                    onOpenChange={(next) =>
                      setOpenCandidate(next ? step.id : null)
                    }
                  />
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
            className="rounded-3xl bg-platform-soft/70 px-4 py-8 ring-1 ring-platform/15"
          >
            <ColumnHeader
              title={PLATFORM_HUB.title}
              tagline={PLATFORM_HUB.tagline}
              accentClass="text-platform"
            />
            <div className="mx-auto mb-8 max-w-xs rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-500 px-5 py-6 text-center text-white shadow-md">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100">
                Project It
              </p>
              <p className="mt-2 text-sm font-medium leading-snug">
                {PLATFORM_HUB.center}
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PLATFORM_HUB.capabilities.map((cap) => (
                <li key={cap.id}>
                  <HoverRevealIcon
                    item={cap}
                    accent={cap.id === "matches" ? "ai" : "platform"}
                    open={openPlatform === cap.id}
                    onOpenChange={(next) =>
                      setOpenPlatform(next ? cap.id : null)
                    }
                  />
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={enter(28)}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-3xl bg-company-soft/60 px-4 py-8 ring-1 ring-company/10"
          >
            <ColumnHeader
              title={COMPANY_COLUMN.title}
              tagline={COMPANY_COLUMN.tagline}
              accentClass="text-company"
            />
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {COMPANY_COLUMN.steps.map((step) => (
                <li key={step.id}>
                  <HoverRevealIcon
                    item={step}
                    accent="company"
                    open={openCompany === step.id}
                    onOpenChange={(next) =>
                      setOpenCompany(next ? step.id : null)
                    }
                  />
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
