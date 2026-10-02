import type { ReviewScreenData } from "@/shared/models/review";

const timestamp = "2026-10-02T09:42:00.000Z";
const dates = { createdAt: timestamp, updatedAt: timestamp };
const sample: ReviewScreenData = {
  submission: {
    id: "sample",
    candidateId: "sample-candidate",
    projectId: "sample-project",
    status: "submitted",
    writtenResponse:
      "I traced the missing deliveries to a stale state update after the API request. I separated the request lifecycle from filtering, added explicit loading and error states, and covered retries and empty results with tests.\n\nFor the trade-off between optimistic updates and accuracy, I chose to refresh delivery status from the API. Dispatchers need a reliable view more than an immediately updated one.",
    repositoryUrl: "https://github.com/example/delivery-tracker",
    fileUrls: [],
    videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
    followUpQuestions: [
      "How would you prevent an older API response from replacing newer delivery data?",
      "Which boundary case would you test next, and why?",
      "How would your approach change if delivery updates arrived in real time?",
    ],
    transcript:
      "The deliveries went missing because an older response could land after a newer one and overwrite it. I split the request lifecycle out of the filtering so each piece is testable, and I chose to refresh status from the API instead of updating optimistically, because dispatchers care more about accuracy than speed.",
    assessmentStatus: "done",
    assessedAt: timestamp,
    assessmentError: null,
    submittedAt: timestamp,
    ...dates,
  },
  candidate: {
    id: "sample-candidate",
    userId: "sample-user",
    university: "University of Bristol",
    location: "Bristol",
    region: "UK",
    skills: ["TypeScript", "React", "Testing"],
    ...dates,
  },
  candidateName: "Alex Morgan",
  project: {
    id: "sample-project",
    title: "Broken Delivery Tracker",
    scenario: "A dispatcher needs a reliable view of deliveries.",
    description: "Repair the delivery tracker and explain your decisions.",
    instructions: "Fix the request lifecycle and add regression tests.",
    type: "platform",
    visibility: "public",
    visibilityTarget: null,
    expectedDurationMinutes: 90,
    difficulty: "Intermediate",
    skills: ["TypeScript", "React", "REST APIs", "Debugging", "Testing"],
    deliverables: ["Repository", "Written explanation", "Walkthrough"],
    deadline: null,
    status: "published",
    createdBy: "platform",
    ...dates,
  },
  company: {
    id: "sample-company",
    name: "Summit Logistics",
    description: "Delivery operations",
    logoUrl: null,
    website: null,
    ...dates,
  },
  reviewer: { id: "sample-reviewer", name: "Summit reviewer" },
  rubric: [
    {
      name: "Debugging",
      description: "Identifies the root cause and explains the fix.",
    },
    {
      name: "Implementation",
      description:
        "Clear, maintainable changes with resilient request handling.",
    },
    {
      name: "Testing",
      description: "Regression coverage for failure, retry and empty states.",
    },
    {
      name: "Communication",
      description: "Explains decisions and trade-offs in the Walkthrough.",
    },
  ],
  evidence: [
    [
      "TypeScript",
      "strong",
      "Typed delivery models and explicit request states.",
    ],
    ["React", "strong", "Separates filtering from the request lifecycle."],
    [
      "REST APIs",
      "partial",
      "Handles retries; cancellation is not demonstrated.",
    ],
    ["Debugging", "strong", "Traces the stale update to its root cause."],
    [
      "Testing",
      "partial",
      "Covers empty results and retries; race conditions are not covered.",
    ],
  ].map(([skill, level, rationale], index) => ({
    id: `sample-evidence-${index}`,
    candidateId: "sample-candidate",
    submissionId: "sample",
    skill,
    level: level as "strong" | "partial",
    source: "ai",
    rationale,
    ...dates,
  })),
  evaluation: null,
  followUpQuestions: [
    "How would you prevent an older API response from replacing newer delivery data?",
    "Which boundary case would you test next, and why?",
    "How would your approach change if delivery updates arrived in real time?",
  ],
  shortlist: null,
};

const storageKey = "projectit-review-sample-v1";

export function getSampleReview(): ReviewScreenData {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved) as ReviewScreenData;
  } catch {}
  return structuredClone(sample);
}

export function saveSampleReview(data: ReviewScreenData) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}
