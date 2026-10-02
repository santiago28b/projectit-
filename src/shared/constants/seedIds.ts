/**
 * Fixed IDs from supabase/seed.sql. Use these in tests, sample data, and the
 * landing-page shortcuts instead of looking rows up by name.
 * Keep in sync with seed.sql (Person A owns both).
 */
function seedId(n: number): string {
  return `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
}

export const SEED_IDS = {
  // users
  mariaUser: seedId(101),
  devUser: seedId(102),
  aishaUser: seedId(103),
  liamUser: seedId(104),
  sofiaUser: seedId(105),
  summitAdmin: seedId(111),
  northwindAdmin: seedId(112),

  // companies
  summit: seedId(201),
  northwind: seedId(202),

  // candidates (candidates.id, not users.id)
  maria: seedId(301),
  dev: seedId(302),
  aisha: seedId(303),
  liam: seedId(304),
  sofia: seedId(305),

  // projects
  brokenDeliveryTracker: seedId(401),
  salesDashboard: seedId(402),
  featureBacklog: seedId(403),
  accessibleCheckout: seedId(404),
  appointmentReminderApi: seedId(411),

  // jobs
  summitIntern: seedId(501),
  northwindBackend: seedId(502),

  // submissions
  devBrokenDelivery: seedId(601),
  aishaBrokenDelivery: seedId(602),
  liamBrokenDelivery: seedId(603),
  sofiaSalesDashboard: seedId(604),
  sofiaAppointmentReminder: seedId(605),
} as const;

/** Exact skill strings used in the seed — matching compares these literally. */
export const SEED_SKILLS = [
  "TypeScript",
  "React",
  "REST APIs",
  "Debugging",
  "Testing",
  "SQL",
  "Python",
  "Data Cleaning",
  "Data Visualization",
  "Product Thinking",
  "Prioritization",
  "Written Communication",
  "Node.js",
  "Accessibility",
] as const;
