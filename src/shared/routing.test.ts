import { describe, expect, it } from "vitest";
import { homeForRole } from "./routing";

describe("homeForRole", () => {
  it("sends each role to its portal", () => {
    expect(homeForRole("candidate")).toBe("/candidate");
    expect(homeForRole("company_admin")).toBe("/company");
    expect(homeForRole("platform_admin")).toBe("/admin");
  });
});
