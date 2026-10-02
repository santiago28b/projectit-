import { Badge } from "@/client/components/ui/badge";
import { cn } from "@/client/lib/utils";
import type { EvidenceSource, UserRole } from "@/shared/models/domain";

/** Role colors from the spec, as Tailwind classes (see globals.css). */
export const ROLE_STYLES: Record<
  UserRole,
  { label: string; text: string; bg: string; soft: string; dot: string }
> = {
  candidate: {
    label: "Candidate",
    text: "text-candidate",
    bg: "bg-candidate",
    soft: "bg-candidate-soft",
    dot: "bg-candidate",
  },
  company_admin: {
    label: "Company",
    text: "text-company",
    bg: "bg-company",
    soft: "bg-company-soft",
    dot: "bg-company",
  },
  platform_admin: {
    label: "Platform",
    text: "text-platform",
    bg: "bg-platform",
    soft: "bg-platform-soft",
    dot: "bg-platform",
  },
};

export function RoleBadge({
  role,
  className,
}: {
  role: UserRole;
  className?: string;
}) {
  const style = ROLE_STYLES[role];
  return (
    <Badge className={cn(style.soft, style.text, className)}>
      {style.label}
    </Badge>
  );
}

/** "AI-assessed" (teal) or "Company-reviewed" (blue) label for Evidence. */
export function EvidenceSourceBadge({
  source,
  className,
}: {
  source: EvidenceSource;
  className?: string;
}) {
  return source === "ai" ? (
    <Badge className={cn("bg-ai-soft text-ai", className)}>AI-assessed</Badge>
  ) : (
    <Badge className={cn("bg-company-soft text-company", className)}>
      Company-reviewed
    </Badge>
  );
}
