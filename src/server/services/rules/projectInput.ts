import type { CreateProjectInput } from "@/shared/models/projects";

const VISIBILITIES = new Set(["public", "university", "region", "invite"]);

/** Pure validation for creating a Company Project. Throws on bad input. */
export function validateCreateInput(input: CreateProjectInput): void {
  if (!input.title?.trim()) throw new Error("Title is required");
  if (!input.scenario?.trim()) throw new Error("Scenario is required");
  if (!input.instructions?.trim()) throw new Error("Instructions are required");
  if (!Array.isArray(input.skills) || input.skills.length === 0) {
    throw new Error("At least one skill is required");
  }
  if (!Array.isArray(input.deliverables) || input.deliverables.length === 0) {
    throw new Error("At least one deliverable is required");
  }
  if (!VISIBILITIES.has(input.visibility)) {
    throw new Error("Invalid Visibility");
  }
  if (
    (input.visibility === "university" || input.visibility === "region") &&
    !input.visibilityTarget?.trim()
  ) {
    throw new Error("Visibility target is required");
  }
  if (!Array.isArray(input.rubric) || input.rubric.length === 0) {
    throw new Error("At least one Rubric category is required");
  }
  for (const criterion of input.rubric) {
    if (!criterion.name?.trim() || !criterion.description?.trim()) {
      throw new Error("Each Rubric category needs a name and description");
    }
  }
}
