// // import fs from 'fs';
// // import path from 'path';
// // import matter from 'gray-matter';
// // import { remark } from 'remark';
// // import html from 'remark-html';
// // import { Article, ArticleMetadata } from './types';

// // const articlesDirectory = path.join(process.cwd(), 'content/articles');

// // export async function getArticleBySlug(slug: string): Promise<Article> {
// //   const fullPath = path.join(articlesDirectory, `${slug}.md`);
// //   const fileContents = fs.readFileSync(fullPath, 'utf8');
// //   const { data, content } = matter(fileContents);

// //   // Convert markdown to HTML
// //   const processedContent = await remark().use(html).process(content);
// //   const contentHtml = processedContent.toString();

// //   return {
// //     title: data.title || 'Untitled',
// //     date: data.date || new Date().toISOString().split('T')[0],
// //     author: data.author || 'Anonymous',
// //     tags: Array.isArray(data.tags) ? data.tags : [],
// //     slug: slug,
// //     excerpt: data.excerpt || '',
// //     content,
// //     contentHtml,
// //   };
// // }

// // export function getAllArticles(): ArticleMetadata[] {
// //   // Check if directory exists
// //   if (!fs.existsSync(articlesDirectory)) {
// //     console.warn('Articles directory does not exist:', articlesDirectory);
// //     return [];
// //   }

// //   const fileNames = fs.readdirSync(articlesDirectory);
  
// //   // Filter only .md files
// //   const mdFiles = fileNames.filter(file => file.endsWith('.md'));
  
// //   if (mdFiles.length === 0) {
// //     console.warn('No markdown files found in:', articlesDirectory);
// //     return [];
// //   }

// //   const articles = mdFiles.map((fileName) => {
// //     try {
// //       const slug = fileName.replace(/\.md$/, '');
// //       const fullPath = path.join(articlesDirectory, fileName);
// //       const fileContents = fs.readFileSync(fullPath, 'utf8');
// //       const { data } = matter(fileContents);

// //       return {
// //         title: data.title || 'Untitled',
// //         date: data.date || new Date().toISOString().split('T')[0],
// //         author: data.author || 'Anonymous',
// //         tags: Array.isArray(data.tags) ? data.tags : [],
// //         slug: slug,
// //         excerpt: data.excerpt || '',
// //       };
// //     } catch (error) {
// //       console.error(`Error processing file ${fileName}:`, error);
// //       // Return a safe default instead of crashing
// //       return {
// //         title: 'Error Loading Article',
// //         date: new Date().toISOString().split('T')[0],
// //         author: 'System',
// //         tags: ['error'],
// //         slug: fileName.replace(/\.md$/, ''),
// //         excerpt: 'This article could not be loaded',
// //       };
// //     }
// //   });

// //   // Sort by date (newest first)
// //   return articles.sort((a, b) => {
// //     try {
// //       return new Date(b.date).getTime() - new Date(a.date).getTime();
// //     } catch {
// //       return 0;
// //     }
// //   });
// // }

// // export function getArticlesByTag(tag: string): ArticleMetadata[] {
// //   const allArticles = getAllArticles();
// //   return allArticles.filter((article) => {
// //     // Defensive check
// //     return Array.isArray(article.tags) && article.tags.includes(tag);
// //   });
// // }

// // export function getAllTags(): string[] {
// //   const articles = getAllArticles();
// //   const tagsSet = new Set<string>();
  
// //   articles.forEach((article) => {
// //     // Defensive check - only process if tags exist and is an array
// //     if (article.tags && Array.isArray(article.tags)) {
// //       article.tags.forEach((tag) => {
// //         if (tag && typeof tag === 'string') {
// //           tagsSet.add(tag);
// //         }
// //       });
// //     }
// //   });
  
// //   return Array.from(tagsSet).sort();
// // }
// import matter from "gray-matter";
// import { remark } from "remark";
// import html from "remark-html";
// import { unstable_cache } from "next/cache";
// import { Article, ArticleMetadata } from "./types";

// /**
//  * Option 2: Runtime content from GitHub (no fs).
//  * - Content updates do NOT require redeploy (only webhook revalidation).
//  * - Use unstable_cache tags so /api/revalidate can call revalidateTag().
//  */

// const OWNER = process.env.GITHUB_OWNER;
// const REPO = process.env.GITHUB_REPO;
// const BRANCH = process.env.GITHUB_BRANCH || "main";
// const TOKEN = process.env.GITHUB_TOKEN;

// const headers: HeadersInit = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};

// // Small helper to ensure envs exist at runtime (but don't crash build)
// function hasGitHubEnv() {
//   return Boolean(OWNER && REPO && BRANCH);
// }

// // Fetch a markdown file from GitHub RAW
// async function fetchMarkdownFromGitHub(filePath: string): Promise<string> {
//   if (!hasGitHubEnv()) throw new Error("Missing GitHub env vars");

//   const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${filePath}`;
//   const res = await fetch(url, {
//     headers,
//     // allow caching layer to control caching; tags handle invalidation
//     cache: "no-store",
//   });

//   if (!res.ok) {
//     throw new Error(`Markdown not found: ${filePath} (${res.status})`);
//   }
//   return res.text();
// }

// // List all markdown paths under content/articles via GitHub Tree API
// async function fetchAllArticlePaths(): Promise<string[]> {
//   // Never crash build: return [] on any failure
//   try {
//     if (!hasGitHubEnv()) return [];

//     const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`;
//     const res = await fetch(apiUrl, {
//       headers,
//       cache: "no-store",
//     });

//     if (!res.ok) return [];

//     const data = await res.json();
//     const tree = Array.isArray(data?.tree) ? data.tree : [];

//     return tree
//       .filter((f: any) => typeof f?.path === "string")
//       .map((f: any) => f.path as string)
//       .filter((p: string) => p.startsWith("content/articles/") && p.endsWith(".md"));
//   } catch {
//     return [];
//   }
// }

// // Convert markdown -> HTML for article body
// async function markdownToHtml(markdown: string): Promise<string> {
//   const processed = await remark().use(html).process(markdown);
//   return processed.toString();
// }

// /* ---------------- RAW (UNCACHED) FUNCTIONS ---------------- */

// async function _getAllArticles(): Promise<ArticleMetadata[]> {
//   const paths = await fetchAllArticlePaths();

//   // If GitHub listing failed, return empty array (no crash)
//   if (!paths.length) return [];

//   const metas = await Promise.all(
//     paths.map(async (p) => {
//       try {
//         const raw = await fetchMarkdownFromGitHub(p);
//         const { data } = matter(raw);
//         const slug = p.split("/").pop()!.replace(/\.md$/, "");

//         return {
//           ...(data as ArticleMetadata),
//           slug,
//           // normalize tags
//           tags: Array.isArray((data as any)?.tags) ? (data as any).tags : [],
//           // normalize other optional fields if your UI expects them
//           title: (data as any)?.title ?? "Untitled",
//           date: (data as any)?.date ?? new Date().toISOString().split("T")[0],
//           author: (data as any)?.author ?? "Anonymous",
//           excerpt: (data as any)?.excerpt ?? "",
//         } satisfies ArticleMetadata;
//       } catch {
//         // Skip bad files, don't crash
//         return null;
//       }
//     })
//   );

//   const articles = metas.filter(Boolean) as ArticleMetadata[];

//   // Sort newest first
//   return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
// }

// async function _getArticleBySlug(slug: string): Promise<Article> {
//   const raw = await fetchMarkdownFromGitHub(`content/articles/${slug}.md`);
//   const { data, content } = matter(raw);
//   const contentHtml = await markdownToHtml(content);

//   return {
//     ...(data as ArticleMetadata),
//     slug,
//     tags: Array.isArray((data as any)?.tags) ? (data as any).tags : [],
//     title: (data as any)?.title ?? "Untitled",
//     date: (data as any)?.date ?? new Date().toISOString().split("T")[0],
//     author: (data as any)?.author ?? "Anonymous",
//     excerpt: (data as any)?.excerpt ?? "",
//     content,
//     contentHtml,
//   };
// }

// async function _getAllTags(): Promise<string[]> {
//   const articles = await _getAllArticles();
//   const set = new Set<string>();
//   for (const a of articles) {
//     (a.tags || []).forEach((t) => {
//       if (typeof t === "string" && t.trim()) set.add(t.trim());
//     });
//   }
//   return Array.from(set).sort();
// }

// async function _getArticlesByTag(tag: string): Promise<ArticleMetadata[]> {
//   const articles = await _getAllArticles();
//   return articles.filter((a) => Array.isArray(a.tags) && a.tags.includes(tag));
// }

// /* ---------------- CACHED EXPORTS (USE THESE) ---------------- */

// // Lists
// export const getAllArticles = unstable_cache(
//   async () => _getAllArticles(),
//   ["articles"],
//   { tags: ["articles"] }
// );

// // Single article (per slug)
// export const getArticleBySlug = (slug: string) =>
//   unstable_cache(
//     async () => _getArticleBySlug(slug),
//     ["article", slug],
//     { tags: ["articles", `article:${slug}`] }
//   )();

// // Tags list
// export const getAllTags = unstable_cache(
//   async () => _getAllTags(),
//   ["tags"],
//   { tags: ["tags", "articles"] }
// );

// // Articles by tag
// export const getArticlesByTag = (tag: string) =>
//   unstable_cache(
//     async () => _getArticlesByTag(tag),
//     ["tag", tag],
//     { tags: ["articles", `tag:${tag}`] }
//   )();
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { unstable_cache } from "next/cache";
import { Article, ArticleMetadata } from "./types";

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN;

function assertEnv() {
  if (!OWNER || !REPO || !BRANCH) {
    throw new Error("Missing GitHub env vars: GITHUB_OWNER/GITHUB_REPO/GITHUB_BRANCH");
  }
}

const ghHeaders: HeadersInit = {
  Accept: "application/vnd.github+json",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
  // Some environments behave better with a UA
  "User-Agent": "nextjs-on-demand-isr",
};

async function fetchArticleIndexPaths(): Promise<string[]> {
  try {
    assertEnv();

    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/content/articles?ref=${BRANCH}`;

    const res = await fetch(url, {
      headers: {
        ...ghHeaders,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("GitHub contents list failed:", res.status, text);
      return [];
    }

    // IMPORTANT: sometimes GitHub returns an object {message: "..."} (rate limit / auth)
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("GitHub contents list returned non-JSON:", text);
      return [];
    }

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


async function fetchMarkdown(path: string): Promise<string> {
  // Fetch raw file content via GitHub Contents API (raw accept)
  assertEnv();

  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: {
      ...ghHeaders,
      Accept: "application/vnd.github.raw",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Markdown not found: ${path} (${res.status})`);
  }

  return res.text();
}

async function markdownToHtml(md: string) {
  const processed = await remark().use(html).process(md);
  return processed.toString();
}

/* ---------------- RAW (UNCACHED) ---------------- */

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

  return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

async function _getAllTags(): Promise<string[]> {
  const articles = await _getAllArticles();
  const set = new Set<string>();
  for (const a of articles) {
    (a.tags || []).forEach((t) => {
      if (typeof t === "string" && t.trim()) set.add(t.trim());
    });
  }
  return Array.from(set).sort();
}

async function _getArticlesByTag(tag: string): Promise<ArticleMetadata[]> {
  const articles = await _getAllArticles();
  return articles.filter((a) => Array.isArray(a.tags) && a.tags.includes(tag));
}

/* ---------------- CACHED EXPORTS (webhook clears these via revalidateTag) ---------------- */

export const getAllArticles = unstable_cache(
  async () => _getAllArticles(),
  ["articles"],
  { tags: ["articles"] }
);

export const getArticleBySlug = (slug: string) =>
  unstable_cache(
    async () => _getArticleBySlug(slug),
    ["article", slug],
    { tags: ["articles", `article:${slug}`] }
  )();

export const getAllTags = unstable_cache(
  async () => _getAllTags(),
  ["tags"],
  { tags: ["tags", "articles"] }
);

export const getArticlesByTag = (tag: string) =>
  unstable_cache(
    async () => _getArticlesByTag(tag),
    ["tag", tag],
    { tags: ["articles", `tag:${tag}`] }
  )();
