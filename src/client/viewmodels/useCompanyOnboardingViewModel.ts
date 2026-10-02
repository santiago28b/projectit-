"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { sessionService } from "@/client/services/sessionService";
import { SEED_IDS } from "@/shared/constants/seedIds";

export function useCompanyOnboardingViewModel() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !workEmail.trim()) {
      setError("Company name, your name, and work email are required.");
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        await sessionService.switchTo(SEED_IDS.summitAdmin);
        router.push("/company");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Onboarding failed");
      }
    });
  }

  return {
    companyName,
    setCompanyName,
    contactName,
    setContactName,
    workEmail,
    setWorkEmail,
    error,
    isPending,
    submit,
  };
}
