import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentCandidate } from "@/server/lib/currentUser";
import { projectsService } from "@/server/services/projects";
import type { Candidate } from "@/shared/models/domain";

import { projectsController } from "./projectsController";

vi.mock("@/server/lib/currentUser", () => ({ getCurrentCandidate: vi.fn() }));
vi.mock("@/server/services/projects", () => ({
  projectsService: { listMarketplace: vi.fn(), getDetail: vi.fn() },
}));

const maria = { id: "00000000-0000-0000-0000-000000000301" } as Candidate;
const projectId = "00000000-0000-0000-0000-000000000401";
const req = new NextRequest("http://localhost/api/marketplace?candidateId=someone-else");

describe("GET /api/marketplace", () => {
  beforeEach(() => vi.mocked(getCurrentCandidate).mockResolvedValue(maria));

  it("lists Projects for the signed-in Candidate, ignoring a candidateId query param", async () => {
    vi.mocked(projectsService.listMarketplace).mockResolvedValue([]);
    const res = await projectsController.listMarketplace(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ projects: [] });
    expect(projectsService.listMarketplace).toHaveBeenCalledWith(maria);
  });

  it("lists public Projects for a Guest (no Candidate)", async () => {
    vi.mocked(getCurrentCandidate).mockResolvedValue(null);
    vi.mocked(projectsService.listMarketplace).mockResolvedValue([]);
    const res = await projectsController.listMarketplace(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ projects: [] });
    expect(projectsService.listMarketplace).toHaveBeenCalledWith(null);
  });
});

describe("GET /api/projects/[id]", () => {
  beforeEach(() => {
    vi.mocked(getCurrentCandidate).mockResolvedValue(maria);
    vi.mocked(projectsService.getDetail).mockReset();
  });

  it("returns the Project detail", async () => {
    vi.mocked(projectsService.getDetail).mockResolvedValue({ id: projectId } as never);
    const res = await projectsController.getById(req, projectId);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ project: { id: projectId } });
  });

  it("returns 404 when the Candidate isn't eligible", async () => {
    vi.mocked(projectsService.getDetail).mockResolvedValue(null);
    expect((await projectsController.getById(req, projectId)).status).toBe(404);
  });

  it("returns 404 without querying for a malformed id", async () => {
    expect((await projectsController.getById(req, "not-a-uuid")).status).toBe(404);
    expect(projectsService.getDetail).not.toHaveBeenCalled();
  });

  it("returns public Project detail for a Guest", async () => {
    vi.mocked(getCurrentCandidate).mockResolvedValue(null);
    vi.mocked(projectsService.getDetail).mockResolvedValue({
      id: projectId,
    } as never);
    const res = await projectsController.getById(req, projectId);
    expect(res.status).toBe(200);
    expect(projectsService.getDetail).toHaveBeenCalledWith(projectId, null);
  });
});
