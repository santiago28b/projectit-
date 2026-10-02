/**
 * Pure matching + Evidence rules. NO Supabase imports here:
 * services fetch rows, then call these functions.
 */
import type {
  Candidate,
  CompanyProjectRelationship,
  Evidence,
  EvidenceLevel,
  EvidenceSource,
  Job,
  Project,
} from "@/shared/models/domain";

export interface EvidenceProfileEntry {
  skill: string;
  level: EvidenceLevel;
  source: EvidenceSource;
  projectId: string;
  projectTitle: string;
  /** The Submission this level came from (used to link to its review). */
  submissionId?: string;
}

/** Ranked result. The score is only for sorting and is never returned. */
export interface MatchResult<T> {
  item: T;
  reasons: string[];
}

export interface CompanyProjectLink {
  companyId: string;
  projectId: string;
  relationshipType: CompanyProjectRelationship;
}

export interface CandidateWithProfile {
  candidate: Candidate;
  profile: EvidenceProfileEntry[];
  /** Submissions made; more completed Projects rank higher among Candidates who fit. */
  projectsCompleted?: number;
}

/** One Project a Candidate has submitted to. */
export interface CompletedProject {
  candidateId: string;
  projectType: Project["type"];
  expectedDurationMinutes: number | null;
}

/** How much work a Candidate has done on Project It. */
export interface TrackRecord {
  projectsCompleted: number;
  /** Sum of the Projects' expected durations (actual time isn't tracked). */
  minutesCompleted: number;
  companyProjectsCompleted: number;
}

/** Track record per Candidate; Candidates with no Submissions get zeros. */
export function summarizeTrackRecords(
  candidateIds: string[],
  completed: CompletedProject[],
): Map<string, TrackRecord> {
  const out = new Map<string, TrackRecord>(
    candidateIds.map((id) => [
      id,
      { projectsCompleted: 0, minutesCompleted: 0, companyProjectsCompleted: 0 },
    ]),
  );
  for (const c of completed) {
    const record = out.get(c.candidateId);
    if (!record) continue;
    record.projectsCompleted += 1;
    record.minutesCompleted += c.expectedDurationMinutes ?? 0;
    if (c.projectType === "company") record.companyProjectsCompleted += 1;
  }
  return out;
}

/** strong > partial > not_shown > not_assessed */
export const LEVEL_RANK: Record<EvidenceLevel, number> = {
  strong: 3,
  partial: 2,
  not_shown: 1,
  not_assessed: 0,
};

/** Points a skill earns toward a Match. Only shown Evidence counts. */
const EVIDENCE_POINTS: Partial<Record<EvidenceLevel, number>> = {
  strong: 3,
  partial: 2,
};
const PROFILE_ONLY_POINTS = 1;
/** Bonus per completed Project when ranking Candidates for a Job. */
const COMPLETED_PROJECT_POINTS = 2;

const LEVEL_LABEL: Record<EvidenceLevel, string> = {
  strong: "Strong",
  partial: "Partial",
  not_shown: "No",
  not_assessed: "Unassessed",
};

const SOURCE_LABEL: Record<EvidenceSource, string> = {
  ai: "AI-assessed",
  company: "Company-reviewed",
};

/** Skills are compared case- and space-insensitively ("REST APIs" == "rest apis"). */
function norm(skill: string): string {
  return skill.trim().toLowerCase();
}

function sameText(a: string | null, b: string | null): boolean {
  return a !== null && b !== null && norm(a) === norm(b);
}

/** Sort by score (high first), then by a stable label, and drop the score. */
function finish<T>(
  scored: { item: T; score: number; reasons: string[]; label: string }[],
): MatchResult<T>[] {
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .map(({ item, reasons }) => ({ item, reasons }));
}

/** How much one skill contributes, plus the reason to show for it. */
function scoreSkill(
  skill: string,
  profileBySkill: Map<string, EvidenceProfileEntry>,
  profileSkills: Set<string>,
): { points: number; reason: string | null } {
  const entry = profileBySkill.get(norm(skill));
  const points = entry ? EVIDENCE_POINTS[entry.level] : undefined;
  if (entry && points) {
    return {
      points,
      reason: `${LEVEL_LABEL[entry.level]} ${entry.skill} Evidence (${entry.projectTitle}, ${SOURCE_LABEL[entry.source]})`,
    };
  }
  if (profileSkills.has(norm(skill))) {
    return { points: PROFILE_ONLY_POINTS, reason: null };
  }
  return { points: 0, reason: null };
}

function indexProfile(profile: EvidenceProfileEntry[]) {
  return new Map(profile.map((e) => [norm(e.skill), e]));
}

/**
 * Strongest level per skill across all Submissions.
 * On the SAME Submission, a `company` row beats an `ai` row.
 */
export function buildEvidenceProfile(
  evidence: Evidence[],
  projectsBySubmission: Record<string, Pick<Project, "id" | "title">>,
): EvidenceProfileEntry[] {
  // Pass 1: one winner per (Submission, skill). Company beats AI; then stronger wins.
  const perSubmission = new Map<string, Evidence>();
  for (const ev of evidence) {
    const key = `${ev.submissionId}::${norm(ev.skill)}`;
    const current = perSubmission.get(key);
    if (!current) {
      perSubmission.set(key, ev);
      continue;
    }
    const evIsCompany = ev.source === "company";
    const curIsCompany = current.source === "company";
    if (evIsCompany !== curIsCompany) {
      if (evIsCompany) perSubmission.set(key, ev);
    } else if (LEVEL_RANK[ev.level] > LEVEL_RANK[current.level]) {
      perSubmission.set(key, ev);
    }
  }

  // Pass 2: strongest level per skill across Submissions.
  const perSkill = new Map<string, Evidence>();
  for (const ev of perSubmission.values()) {
    const key = norm(ev.skill);
    const current = perSkill.get(key);
    if (!current || LEVEL_RANK[ev.level] > LEVEL_RANK[current.level]) {
      perSkill.set(key, ev);
    }
  }

  return [...perSkill.values()].map((ev) => {
    const project = projectsBySubmission[ev.submissionId];
    return {
      skill: ev.skill,
      level: ev.level,
      source: ev.source,
      projectId: project?.id ?? "",
      projectTitle: project?.title ?? "Unknown Project",
      submissionId: ev.submissionId,
    };
  });
}

/** Published, and public / matching university / matching region / invited. */
export function isEligible(
  project: Project,
  candidate: Candidate,
  invitedProjectIds: string[],
): boolean {
  if (project.status !== "published") return false;
  if (invitedProjectIds.includes(project.id)) return true;

  switch (project.visibility) {
    case "public":
      return true;
    case "university":
      return sameText(project.visibilityTarget, candidate.university);
    case "region":
      return sameText(project.visibilityTarget, candidate.region);
    case "invite":
      return false;
  }
}

/** Eligible Projects ranked by profile skills + Evidence. Drops zero-fit. */
export function rankProjectsForCandidate(
  candidate: Candidate,
  profile: EvidenceProfileEntry[],
  projects: Project[],
  invitedProjectIds: string[] = [],
): MatchResult<Project>[] {
  const profileBySkill = indexProfile(profile);
  const profileSkills = new Set(candidate.skills.map(norm));

  return finish(
    projects
      .filter((p) => p.visibility !== "invite" && isEligible(p, candidate, invitedProjectIds))
      .map((project) => {
        let score = 0;
        const reasons: string[] = [];
        const fromProfile: string[] = [];

        for (const skill of project.skills) {
          const { points, reason } = scoreSkill(skill, profileBySkill, profileSkills);
          score += points;
          if (reason) reasons.push(reason);
          else if (points > 0) fromProfile.push(skill);
        }
        if (fromProfile.length > 0) {
          reasons.push(`Uses ${fromProfile.join(", ")} from your profile`);
        }
        return { item: project, score, reasons, label: project.title };
      }),
  );
}

/**
 * Required skills count double vs preferred. Drops zero-fit.
 * Among Candidates who fit, more completed Projects rank higher.
 */
export function rankCandidatesForJob(
  job: Job,
  candidates: CandidateWithProfile[],
): MatchResult<Candidate>[] {
  const required = new Set(job.requiredSkills.map(norm));
  const jobSkills = [
    ...job.requiredSkills,
    ...job.preferredSkills.filter((s) => !required.has(norm(s))),
  ];

  return finish(
    candidates.map(({ candidate, profile, projectsCompleted = 0 }) => {
      const profileBySkill = indexProfile(profile);
      const profileSkills = new Set(candidate.skills.map(norm));
      let score = 0;
      const reasons: string[] = [];
      const fromProfile: string[] = [];

      for (const skill of jobSkills) {
        const weight = required.has(norm(skill)) ? 2 : 1;
        const { points, reason } = scoreSkill(skill, profileBySkill, profileSkills);
        score += points * weight;
        if (reason) reasons.push(reason);
        else if (points > 0) fromProfile.push(skill);
      }
      if (fromProfile.length > 0) {
        reasons.push(`Lists ${fromProfile.join(", ")} on profile (no Evidence yet)`);
      }
      // Experience only boosts Candidates who already fit; it never adds a no-fit one.
      if (score > 0) score += projectsCompleted * COMPLETED_PROJECT_POINTS;
      return { item: candidate, score, reasons, label: candidate.id };
    }),
  );
}

/** Projects sharing skills with the Job, most overlap first. */
export function projectsForJob(
  job: Job,
  projects: Project[],
): MatchResult<Project>[] {
  const jobSkills = new Set(
    [...job.requiredSkills, ...job.preferredSkills].map(norm),
  );

  return finish(
    projects
      .filter((p) => p.status !== "closed")
      .map((project) => {
        const shared = project.skills.filter((s) => jobSkills.has(norm(s)));
        return {
          item: project,
          score: shared.length,
          reasons: shared.length > 0 ? [`Tests ${shared.join(", ")}`] : [],
          label: project.title,
        };
      }),
  );
}

/** Only the Project's owner or sponsor Company can view its Submissions. */
export function canViewSubmission(
  companyId: string,
  projectId: string,
  links: CompanyProjectLink[],
): boolean {
  return links.some(
    (l) =>
      l.companyId === companyId &&
      l.projectId === projectId &&
      (l.relationshipType === "owner" || l.relationshipType === "sponsor"),
  );
}
