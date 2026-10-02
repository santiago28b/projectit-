import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  Cloud,
  Eye,
  FileText,
  Layers,
  ListChecks,
  PlayCircle,
  Search,
  Sparkles,
  Trophy,
  Upload,
  Users,
  Video,
} from "lucide-react";

export type RevealItem = {
  id: string;
  label: string;
  detail: string;
  icon: LucideIcon;
};

export const HERO = {
  brand: "Project It",
  headline: "See what candidates can do, not just what their resumes say",
  pitch:
    "Companies publish short Projects. Candidates submit work and a Walkthrough. AI turns that into Evidence and Matches — with reasons, never a percentage.",
} as const;

export const CANDIDATE_COLUMN = {
  title: "Candidates",
  tagline: "Show what you can do, not just what's on your resume.",
  steps: [
    {
      id: "browse",
      label: "Browse Projects",
      detail:
        "Find public Projects from Companies in the Marketplace — short, realistic work you can take now.",
      icon: Search,
    },
    {
      id: "complete",
      label: "Complete a Project",
      detail:
        "Spend about 1–2 hours on a focused, real-world task with clear instructions and deliverables.",
      icon: Layers,
    },
    {
      id: "upload",
      label: "Upload your solution",
      detail:
        "Submit a repository URL, files, and a written explanation of what you built.",
      icon: Upload,
    },
    {
      id: "walkthrough",
      label: "Submit a Walkthrough",
      detail:
        "Record a short video covering your approach, decisions, and trade-offs — proof you own the work.",
      icon: PlayCircle,
    },
    {
      id: "shortlist",
      label: "Get shortlisted",
      detail:
        "Stand out with Evidence and Matches so Companies invite you to interview based on skills shown.",
      icon: Trophy,
    },
  ] satisfies RevealItem[],
};

export const COMPANY_COLUMN = {
  title: "Companies",
  tagline: "Post Projects, evaluate talent, hire with confidence.",
  steps: [
    {
      id: "jobs",
      label: "Post Jobs",
      detail:
        "Share roles with required and preferred skills so Project It knows what you're hiring for.",
      icon: FileText,
    },
    {
      id: "projects",
      label: "Create or select Projects",
      detail:
        "Build your own screening Projects or Sponsor Platform Projects written by Project It.",
      icon: Building2,
    },
    {
      id: "visibility",
      label: "Choose Visibility",
      detail:
        "Open Projects to everyone, limit them to a university or region, or invite specific Candidates.",
      icon: Eye,
    },
    {
      id: "review",
      label: "Review and shortlist",
      detail:
        "Compare Submissions, Walkthroughs, and Evidence — then Shortlist Candidates to interview.",
      icon: BarChart3,
    },
  ] satisfies RevealItem[],
};

export const PLATFORM_HUB = {
  title: "Project It Platform",
  tagline: "Connects Companies, Projects, and talent with AI-powered support.",
  center: "Turn real Projects into real opportunities.",
  capabilities: [
    {
      id: "hosting",
      label: "Project hosting",
      detail:
        "Every Project lives in one place — instructions, deliverables, Rubric, and Submissions together.",
      icon: Cloud,
    },
    {
      id: "platform-projects",
      label: "Platform Projects",
      detail:
        "Ready-made Projects Companies can Sponsor so Candidates get attention from real hiring teams.",
      icon: ListChecks,
    },
    {
      id: "walkthrough-support",
      label: "Walkthrough + video",
      detail:
        "Required Walkthroughs prove Candidates understand their own work — not just pasted code.",
      icon: Video,
    },
    {
      id: "evaluation",
      label: "Evaluation dashboard",
      detail:
        "Review Submissions against the Rubric and override AI Evidence when humans disagree.",
      icon: BarChart3,
    },
    {
      id: "shortlisting",
      label: "Shortlisting support",
      detail:
        "Organize who to interview next with Evidence labeled AI-assessed or Company-reviewed.",
      icon: Users,
    },
    {
      id: "matches",
      label: "AI Matches",
      detail:
        "Suggested pairings always come with reasons — never a black-box percentage.",
      icon: Sparkles,
    },
  ] satisfies RevealItem[],
};

export const END_TO_END = [
  "Job",
  "Recommended Project",
  "Submission + Walkthrough",
  "Company review",
  "Interview shortlist",
] as const;
