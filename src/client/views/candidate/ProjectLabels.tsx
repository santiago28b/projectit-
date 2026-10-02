import { Badge } from "@/client/components/ui/badge";
import type { ProjectCard } from "@/shared/models/projects";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60 || minutes % 60 !== 0) return `~${minutes} min`;
  return `~${minutes / 60} hr`;
}

export function formatDeadline(deadline: string | null): string | null {
  return deadline ? `Due ${dateFormat.format(new Date(deadline))}` : null;
}

/** "Sponsored by Summit Logistics", "By Northwind Health", or "By Project It". */
export function ownerLine(project: ProjectCard): string {
  const sponsors = project.companies.filter((c) => c.relationship === "sponsor");
  const owners = project.companies.filter((c) => c.relationship === "owner");
  if (owners.length > 0) return `By ${owners.map((c) => c.name).join(", ")}`;
  if (sponsors.length > 0)
    return `Sponsored by ${sponsors.map((c) => c.name).join(", ")}`;
  return "By Project It";
}

function visibilityLabel(project: ProjectCard): string {
  switch (project.visibility) {
    case "public":
      return "Public";
    case "university":
      return `${project.visibilityTarget ?? "University"} only`;
    case "region":
      return `${project.visibilityTarget ?? "Regional"} region`;
    case "invite":
      return "Invited";
  }
}

export function ProjectBadges({ project }: { project: ProjectCard }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {project.type === "platform" && (
        <Badge className="bg-platform-soft text-platform">Platform Project</Badge>
      )}
      <Badge variant="outline">{visibilityLabel(project)}</Badge>
    </div>
  );
}

export function SkillList({ skills }: { skills: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Skills evaluated">
      {skills.map((skill) => (
        <li key={skill}>
          <Badge variant="secondary">{skill}</Badge>
        </li>
      ))}
    </ul>
  );
}

/** "~1.5 hr · Due Oct 16" style line; parts that are missing are skipped. */
export function TimingLine({ project }: { project: ProjectCard }) {
  const parts = [
    formatDuration(project.expectedDurationMinutes),
    formatDeadline(project.deadline),
  ].filter(Boolean);
  return parts.length ? (
    <p className="text-sm text-zinc-600">{parts.join(" · ")}</p>
  ) : null;
}
