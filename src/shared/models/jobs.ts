/** What a Company fills in to create a Job. Skills must match Project skill spellings to Match. */
export interface CreateJobInput {
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
}
