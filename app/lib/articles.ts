import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { unstable_cache } from "next/cache";
import type { Article, ArticleMetadata } from "./types";

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN;

function assertEnv() {
  if (!OWNER || !REPO || !BRANCH) {
    throw new Error(
      "Missing GitHub env vars: GITHUB_OWNER / GITHUB_REPO / GITHUB_BRANCH"
    );
  }
}

const ghHeaders: HeadersInit = {
  Accept: "application/vnd.github+json",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
  "User-Agent": "nextjs-on-demand-isr",
};

// The raw fetch functions are not cached. They are wrapped by cached functions below.
async function fetchArticleIndexPaths(): Promise<string[]> {
  try {
    assertEnv();
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/content/articles?ref=${BRANCH}`;
    const res = await fetch(url, {
      headers: { ...ghHeaders, "X-GitHub-Api-Version": "2022-11-28" },
      // Use Next.js's fetch caching. Revalidation is handled by tags.
      next: { tags: ["articles"] },
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("GitHub contents list failed:", res.status, text);
      return [];
    }
    const data = JSON.parse(text);
    if (!Array.isArray(data)) {
      console.error("GitHub contents list returned non-array:", data);
      return [];
    }
    return data
      .filter((item: any) => item?.type === "file" && typeof item?.path === "string")
      .map((item: any) => item.path as string)
      .filter((p: string) => p.endsWith(".md"));
  } catch (e) {
    console.error("fetchArticleIndexPaths error:", e);
    return [];
  }
}

async function fetchMarkdown(filePath: string): Promise<string> {
  assertEnv();
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}?ref=${BRANCH}`;
  const slug = filePath.split("/").pop()!.replace(/\.md$/, "");
  const res = await fetch(url, {
    headers: {
      ...ghHeaders,
      Accept: "application/vnd.github.raw",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    // Cache this fetch against the article's slug
    next: { tags: [`article:${slug}`] },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Markdown not found: ${filePath} (${res.status}) ${txt}`);
  }
  return res.text();
}

async function markdownToHtml(md: string): Promise<string> {
  const processed = await remark().use(html).process(md);
  return processed.toString();
}

/* ---------------- RAW (UNCACHED) INTERNAL FUNCTIONS ---------------- */

async function _getAllArticles(): Promise<ArticleMetadata[]> {
  const paths = await fetchArticleIndexPaths();
  if (!paths.length) return [];
  const metas = await Promise.all(
    paths.map(async (p) => {
      try {
        const raw = await fetchMarkdown(p);
        const { data } = matter(raw);
        const slug = p.split("/").pop()!.replace(/\.md$/, "");
        return {
          ...(data as ArticleMetadata),
          slug,
          title: (data as any)?.title ?? "Untitled",
          date: (data as any)?.date ?? new Date().toISOString().split("T")[0],
          author: (data as any)?.author ?? "Anonymous",
          excerpt: (data as any)?.excerpt ?? "",
          tags: Array.isArray((data as any)?.tags) ? (data as any).tags : [],
        } satisfies ArticleMetadata;
      } catch (e) {
        console.error("Failed to read article:", p, e);
        return null;
      }
    })
  );
  const articles = metas.filter(Boolean) as ArticleMetadata[];
  return articles.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

async function _getArticleBySlug(slug: string): Promise<Article> {
  const raw = await fetchMarkdown(`content/articles/${slug}.md`);
  const { data, content } = matter(raw);
  const contentHtml = await markdownToHtml(content);
  return {
    ...(data as ArticleMetadata),
    slug,
    title: (data as any)?.title ?? "Untitled",
    date: (data as any)?.date ?? new Date().toISOString().split("T")[0],
    author: (data as any)?.author ?? "Anonymous",
    excerpt: (data as any)?.excerpt ?? "",
    tags: Array.isArray((data as any)?.tags) ? (data as any).tags : [],
    content,
    contentHtml,
  };
}

/* ---------------- PUBLIC CACHED FUNCTIONS (FOR UI) ---------------- */

export const getAllArticles = unstable_cache(
  _getAllArticles,
  ["articles"],
  { tags: ["articles"] }
);

export const getArticleBySlug = (slug: string) =>
  unstable_cache(
    () => _getArticleBySlug(slug),
    ["article", slug],
    { tags: ["articles", `article:${slug}`] }
  )();

export const getAllTags = unstable_cache(
  async () => {
    const articles = await getAllArticles();
    const set = new Set<string>();
    for (const a of articles) {
      (a.tags || []).forEach((t) => {
        if (typeof t === "string" && t.trim()) set.add(t.trim());
      });
    }
    return Array.from(set).sort();
  },
  ["tags"],
  { tags: ["tags", "articles"] }
);

export const getArticlesByTag = (tag: string) =>
  unstable_cache(
    async () => {
      const articles = await getAllArticles();
      return articles.filter((a) => Array.isArray(a.tags) && a.tags.includes(tag));
    },
    ["tag", tag],
    { tags: ["articles", `tag:${tag}`] }
  )();
