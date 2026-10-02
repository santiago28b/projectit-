# 04: Recommended for you (matching core)

**What to build:** As Maria, the top of my Marketplace shows "Recommended for you": Projects ranked by how well they fit my profile skills and my Evidence, each with a short reason. This ticket builds the matching core that ticket 05 reuses. The Evidence profile uses each Candidate's strongest level per skill across all their Submissions, with a Company-reviewed level beating the AI-assessed one on the same Submission and each entry recording which Project it came from. Ranking is a deterministic formula (skill overlap plus Evidence strength); the AI only phrases the reasons. A percentage or score is never shown. Matches are computed when the page loads; the `matches` table stays unused for now. Write the ranking and Evidence-profile rules as pure functions so they can be tested without the DB.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Evidence profile: strongest level per skill, Company-reviewed overrides AI-assessed, and each entry records its source Project
- [ ] Ranking is deterministic and works with the AI mocked or down
- [ ] Each recommendation shows its reasons (e.g. "uses React and APIs; you have strong Debugging Evidence")
- [ ] Restricted Projects are never recommended to Candidates who aren't eligible
- [ ] No percentage or score in the UI
- [ ] Tests: strongest-level rule; override wins; Maria is recommended Broken Delivery Tracker; every Match has reasons; eligibility is respected
