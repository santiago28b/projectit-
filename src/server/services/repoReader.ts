/**
 * Reads a small, relevant slice of a public GitHub repository for the
 * Assessment: the README, the file list, a few test files, and the source
 * files whose names best match the Project's skills.
 */

export interface RepoFile {
  path: string;
  content: string;
}

export interface RepoSnapshot {
  owner: string;
  repo: string;
  branch: string;
  /** Every readable file path (after skipping dependencies, binaries, …). */
  tree: string[];
  files: RepoFile[];
}

export type RepoReadResult =
  | { ok: true; snapshot: RepoSnapshot }
  | { ok: false; reason: string };

export const MAX_REPO_FILES = 8;
const MAX_TEST_FILES = 3;
const MAX_FILE_BYTES = 50_000;
const MAX_FILE_CHARS = 12_000;
const MAX_TREE_PATHS = 300;

const SKIP_DIRS = /(^|\/)(node_modules|dist|build|out|\.next|\.git|vendor|coverage|\.venv|venv|__pycache__|target)\//;
const LOCKFILES = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|poetry\.lock|Pipfile\.lock|Cargo\.lock|Gemfile\.lock|composer\.lock|go\.sum)$/;
const BINARY = /\.(png|jpe?g|gif|webp|ico|svg|bmp|pdf|zip|gz|tar|mp4|mov|webm|mp3|wav|woff2?|ttf|eot|otf|exe|dll|so|dylib|bin|jar|class|pyc|db|sqlite)$/i;
const MINIFIED = /\.min\.(js|css)$/i;
const README = /^readme(\.[a-z]+)?$/i;
const TEST = /(\.|_)(test|spec)\.[a-z]+$|(^|\/)(__tests__|tests?)\//i;

/** Words in a skill name, plus file hints (e.g. React → .tsx). */
const SKILL_HINTS: Record<string, string[]> = {
  react: ["component", ".tsx", ".jsx", "hook"],
  "rest apis": ["api", "route", "endpoint", "client", "fetch", "server"],
  typescript: [".ts"],
  sql: [".sql", "query", "migration", "db"],
  python: [".py"],
  "data cleaning": ["clean", "etl", "transform"],
  "data visualization": ["chart", "plot", "viz"],
  accessibility: ["a11y", "aria"],
  "node.js": ["server", "express"],
};

export function parseGitHubRepoUrl(url: string): { owner: string; repo: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!/^(www\.)?github\.com$/i.test(parsed.hostname)) return null;
  const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
  if (!owner || !repo) return null;
  return { owner, repo: repo.replace(/\.git$/, "") };
}

function readable(path: string, size: number): boolean {
  return (
    !SKIP_DIRS.test(path) &&
    !LOCKFILES.test(path) &&
    !BINARY.test(path) &&
    !MINIFIED.test(path) &&
    size <= MAX_FILE_BYTES
  );
}

const depth = (path: string) => path.split("/").length;

function skillScore(path: string, skills: string[]): number {
  const lower = path.toLowerCase();
  let score = 0;
  for (const skill of skills) {
    const key = skill.trim().toLowerCase();
    const terms = [...key.split(/\s+/).filter((w) => w.length > 2), ...(SKILL_HINTS[key] ?? [])];
    if (terms.some((t) => lower.includes(t))) score += 1;
  }
  if (lower.startsWith("src/") || lower.startsWith("app/") || lower.startsWith("lib/")) score += 0.5;
  return score;
}

/** Which files Claude should read, in priority order. */
export function selectRepoFiles(
  entries: { path: string; size: number }[],
  skills: string[],
  max = MAX_REPO_FILES,
): string[] {
  const files = entries.filter((e) => readable(e.path, e.size)).map((e) => e.path);
  const byDepth = (a: string, b: string) => depth(a) - depth(b) || a.localeCompare(b);

  const readme = files.filter((p) => README.test(p.split("/").pop() ?? "")).sort(byDepth)[0];
  const tests = files.filter((p) => TEST.test(p) && p !== readme).sort(byDepth).slice(0, MAX_TEST_FILES);
  const taken = new Set([readme, ...tests].filter(Boolean));
  const source = files
    .filter((p) => !taken.has(p) && !TEST.test(p))
    .sort((a, b) => skillScore(b, skills) - skillScore(a, skills) || byDepth(a, b));

  return [...(readme ? [readme] : []), ...tests, ...source].slice(0, max);
}

function clip(text: string): string {
  return text.length > MAX_FILE_CHARS ? `${text.slice(0, MAX_FILE_CHARS)}\n… [truncated]` : text;
}

export function createRepoReader(deps: { fetch?: typeof fetch; token?: string | null } = {}) {
  const doFetch = deps.fetch ?? fetch;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "project-it-assessment",
    ...(deps.token ? { Authorization: `Bearer ${deps.token}` } : {}),
  };
  const get = (url: string) => doFetch(url, { headers, signal: AbortSignal.timeout(15_000) });

  return {
    async read(url: string, skills: string[]): Promise<RepoReadResult> {
      const target = parseGitHubRepoUrl(url);
      if (!target) return { ok: false, reason: "Only public GitHub repositories can be read." };
      const api = `https://api.github.com/repos/${target.owner}/${target.repo}`;

      try {
        const repoRes = await get(api);
        if (repoRes.status === 404 || repoRes.status === 401)
          return { ok: false, reason: "The repository is private or doesn't exist." };
        if (!repoRes.ok) return { ok: false, reason: `GitHub answered ${repoRes.status}.` };
        const repoInfo = (await repoRes.json()) as { default_branch?: string };
        const branch = repoInfo.default_branch ?? "main";

        const treeRes = await get(`${api}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
        if (!treeRes.ok) return { ok: false, reason: `GitHub answered ${treeRes.status}.` };
        const treeBody = (await treeRes.json()) as { tree?: { path: string; type: string; size?: number }[] };
        const blobs = (treeBody.tree ?? [])
          .filter((e) => e.type === "blob")
          .map((e) => ({ path: e.path, size: e.size ?? 0 }));

        const tree = blobs.filter((b) => readable(b.path, b.size)).map((b) => b.path).slice(0, MAX_TREE_PATHS);
        const picked = selectRepoFiles(blobs, skills);
        const raw = `https://raw.githubusercontent.com/${target.owner}/${target.repo}/${encodeURIComponent(branch)}`;
        const files = (
          await Promise.all(
            picked.map(async (path): Promise<RepoFile | null> => {
              const res = await get(`${raw}/${path.split("/").map(encodeURIComponent).join("/")}`);
              return res.ok ? { path, content: clip(await res.text()) } : null;
            }),
          )
        ).filter((f): f is RepoFile => f !== null);

        return { ok: true, snapshot: { ...target, branch, tree, files } };
      } catch {
        return { ok: false, reason: "GitHub couldn't be reached." };
      }
    },
  };
}

export type RepoReader = ReturnType<typeof createRepoReader>;
