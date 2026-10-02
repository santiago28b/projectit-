import type { CreateJobInput } from "@/shared/models/jobs";

function cleanSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of skills) {
    const skill = raw.trim();
    const key = skill.toLowerCase();
    if (!skill || seen.has(key)) continue;
    seen.add(key);
    result.push(skill);
  }
  return result;
}

/**
 * Pure validation for creating a Job. Trims and de-duplicates skills, and a
 * skill listed as required is dropped from preferred. Throws on bad input.
 */
export function normalizeJobInput(input: CreateJobInput): CreateJobInput {
  const title = input.title?.trim() ?? "";
  if (!title) throw new Error("Title is required");
  if (!Array.isArray(input.requiredSkills) || !Array.isArray(input.preferredSkills))
    throw new Error("Invalid skills");

  const requiredSkills = cleanSkills(input.requiredSkills);
  if (requiredSkills.length === 0)
    throw new Error("At least one required skill is required");
  const required = new Set(requiredSkills.map((s) => s.toLowerCase()));
  const preferredSkills = cleanSkills(input.preferredSkills).filter(
    (skill) => !required.has(skill.toLowerCase()),
  );

  return {
    title,
    description: input.description?.trim() ?? "",
    requiredSkills,
    preferredSkills,
  };
}
