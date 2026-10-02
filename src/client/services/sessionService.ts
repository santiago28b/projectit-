import { sessionRepo } from "@/client/repos/sessionRepo";

/** Thin client service — ViewModels call this, not URLs. */
export const sessionService = {
  switchTo(userId: string) {
    return sessionRepo.switchTo(userId);
  },
};
