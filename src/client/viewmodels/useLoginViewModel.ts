"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { sessionService } from "@/client/services/sessionService";
import { SEED_IDS } from "@/shared/constants/seedIds";

export function useLoginViewModel() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        await sessionService.switchTo(SEED_IDS.mariaUser);
        router.push("/candidate");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign-in failed");
      }
    });
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isPending,
    submit,
  };
}
