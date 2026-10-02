import { describe, expect, it, vi } from "vitest";

import { createRepoReader, parseGitHubRepoUrl, selectRepoFiles } from "./repoReader";

describe("parseGitHubRepoUrl", () => {
  it.each([
    ["https://github.com/maria/bdt", { owner: "maria", repo: "bdt" }],
    ["https://github.com/maria/bdt.git", { owner: "maria", repo: "bdt" }],
    ["https://www.github.com/maria/bdt/tree/main/src", { owner: "maria", repo: "bdt" }],
    ["http://github.com/Maria-S/my.repo/", { owner: "Maria-S", repo: "my.repo" }],
  ])("reads %s", (url, expected) => {
    expect(parseGitHubRepoUrl(url)).toEqual(expected);
  });

  it.each([
    ["a GitLab URL", "https://gitlab.com/maria/bdt"],
    ["a profile URL", "https://github.com/maria"],
    ["not a URL", "github maria bdt"],
    ["an empty value", ""],
  ])("rejects %s", (_label, url) => {
    expect(parseGitHubRepoUrl(url)).toBeNull();
  });
});

const entry = (path: string, size = 1_000) => ({ path, size });

describe("selectRepoFiles", () => {
  it("puts the README first, then tests, then source files that match the skills", () => {
    const picked = selectRepoFiles(
      [
        entry("src/utils/strings.ts"),
        entry("src/api/deliveries.ts"),
        entry("src/components/DeliveryList.tsx"),
        entry("src/status.test.ts"),
        entry("README.md"),
      ],
      ["React", "REST APIs", "Testing"],
    );
    expect(picked[0]).toBe("README.md");
    expect(picked[1]).toBe("src/status.test.ts");
    expect(picked.indexOf("src/api/deliveries.ts")).toBeLessThan(picked.indexOf("src/utils/strings.ts"));
  });

  it("skips dependencies, build output, lockfiles, binaries, minified and large files", () => {
    const picked = selectRepoFiles(
      [
        entry("node_modules/react/index.js"),
        entry("dist/app.js"),
        entry(".next/server/page.js"),
        entry("package-lock.json"),
        entry("yarn.lock"),
        entry("public/logo.png"),
        entry("public/app.min.js"),
        entry("src/huge.ts", 60_000),
        entry("src/app.ts"),
      ],
      ["TypeScript"],
    );
    expect(picked).toEqual(["src/app.ts"]);
  });

  it("reads at most 8 files and at most 3 tests", () => {
    const tests = Array.from({ length: 6 }, (_, i) => entry(`tests/t${i}.test.ts`));
    const source = Array.from({ length: 10 }, (_, i) => entry(`src/f${i}.ts`));
    const picked = selectRepoFiles([...tests, ...source], ["Testing"]);
    expect(picked).toHaveLength(8);
    expect(picked.filter((p) => p.includes(".test."))).toHaveLength(3);
  });

  it("prefers shallower paths when nothing else separates them", () => {
    const picked = selectRepoFiles([entry("a/b/c/deep.ts"), entry("src/top.ts")], ["Go"]);
    expect(picked).toEqual(["src/top.ts", "a/b/c/deep.ts"]);
  });
});

function github(routes: Record<string, unknown>) {
  return vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    void init;
    const key = String(url);
    if (!(key in routes)) return new Response("not found", { status: 404 });
    const body = routes[key];
    return typeof body === "string"
      ? new Response(body, { status: 200 })
      : new Response(JSON.stringify(body), { status: 200 });
  });
}

const API = "https://api.github.com/repos/maria/bdt";
const RAW = "https://raw.githubusercontent.com/maria/bdt/main";

describe("repoReader.read", () => {
  it("returns the file list and the contents of the chosen files", async () => {
    const fetchMock = github({
      [API]: { default_branch: "main", private: false },
      [`${API}/git/trees/main?recursive=1`]: {
        truncated: false,
        tree: [
          { path: "README.md", type: "blob", size: 20 },
          { path: "src", type: "tree" },
          { path: "src/status.ts", type: "blob", size: 40 },
          { path: "src/status.test.ts", type: "blob", size: 40 },
        ],
      },
      [`${RAW}/README.md`]: "# Delivery tracker",
      [`${RAW}/src/status.ts`]: "export const status = 1;",
      [`${RAW}/src/status.test.ts`]: "it('works', () => {});",
    });
    const reader = createRepoReader({ fetch: fetchMock });

    const result = await reader.read("https://github.com/maria/bdt", ["Testing"]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot.tree).toEqual(["README.md", "src/status.ts", "src/status.test.ts"]);
    expect(result.snapshot.files.map((f) => f.path)).toEqual([
      "README.md",
      "src/status.test.ts",
      "src/status.ts",
    ]);
    expect(result.snapshot.files[0].content).toBe("# Delivery tracker");
  });

  it("sends the GitHub token when one is set", async () => {
    const fetchMock = github({});
    await createRepoReader({ fetch: fetchMock, token: "ghp_test" }).read("https://github.com/maria/bdt", []);
    const init = fetchMock.mock.calls[0][1]!;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer ghp_test");
  });

  it("says why when the URL isn't a GitHub repository", async () => {
    const result = await createRepoReader({ fetch: vi.fn() }).read("https://gitlab.com/x/y", []);
    expect(result).toEqual({ ok: false, reason: "Only public GitHub repositories can be read." });
  });

  it("says why when the repository is private or missing", async () => {
    const result = await createRepoReader({ fetch: github({}) }).read("https://github.com/maria/bdt", []);
    expect(result).toEqual({ ok: false, reason: "The repository is private or doesn't exist." });
  });

  it("says why when GitHub can't be reached", async () => {
    const offline = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
      void _url;
      void _init;
      throw new Error("offline");
    });
    const result = await createRepoReader({ fetch: offline }).read("https://github.com/maria/bdt", []);
    expect(result).toEqual({ ok: false, reason: "GitHub couldn't be reached." });
  });

  it("caps each file's text so one big file can't crowd out the rest", async () => {
    const fetchMock = github({
      [API]: { default_branch: "main" },
      [`${API}/git/trees/main?recursive=1`]: {
        tree: [{ path: "src/big.ts", type: "blob", size: 40_000 }],
      },
      [`${RAW}/src/big.ts`]: "x".repeat(40_000),
    });
    const result = await createRepoReader({ fetch: fetchMock }).read("https://github.com/maria/bdt", []);
    if (!result.ok) throw new Error(result.reason);
    expect(result.snapshot.files[0].content.length).toBeLessThanOrEqual(12_100);
    expect(result.snapshot.files[0].content).toContain("[truncated]");
  });
});
