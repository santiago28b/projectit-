/** Platform-wide constants safe for client and server. */
export const PLATFORM_NAME = "Project It";

export const USER_ROLES = [
  "candidate",
  "company_admin",
  "platform_admin",
] as const;

/** Cookie holding the seeded user id chosen in the role switcher (not real auth). */
export const CURRENT_USER_COOKIE = "pi_user_id";
