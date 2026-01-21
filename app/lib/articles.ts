// import fs from 'fs';
// import path from 'path';
// import matter from 'gray-matter';
// import { remark } from 'remark';
// import html from 'remark-html';
// import { Article, ArticleMetadata } from './types';

// const articlesDirectory = path.join(process.cwd(), 'content/articles');

// export async function getArticleBySlug(slug: string): Promise<Article> {
//   const fullPath = path.join(articlesDirectory, `${slug}.md`);
//   const fileContents = fs.readFileSync(fullPath, 'utf8');
//   const { data, content } = matter(fileContents);

//   // Convert markdown to HTML
//   const processedContent = await remark().use(html).process(content);
//   const contentHtml = processedContent.toString();

//   return {
//     ...(data as ArticleMetadata),
//     slug, // Filename-derived slug takes precedence
//     content,
//     contentHtml,
//   };
// }

// export function getAllArticles(): ArticleMetadata[] {
//   const fileNames = fs.readdirSync(articlesDirectory);
  
//   const articles = fileNames.map((fileName) => {
//     const slug = fileName.replace(/\.md$/, '');
//     const fullPath = path.join(articlesDirectory, fileName);
//     const fileContents = fs.readFileSync(fullPath, 'utf8');
//     const { data } = matter(fileContents);

//     return {
//       ...(data as ArticleMetadata),
//       slug, // ✅ Moved after spread to take precedence
//     };
//   });

//   // Sort by date (newest first)
//   return articles.sort((a, b) => {
//     return new Date(b.date).getTime() - new Date(a.date).getTime();
//   });
// }

// export function getArticlesByTag(tag: string): ArticleMetadata[] {
//   const allArticles = getAllArticles();
//   return allArticles.filter((article) =>
//     article.tags.includes(tag)
//   );
// }

// export function getAllTags(): string[] {
//   const articles = getAllArticles();
//   const tagsSet = new Set<string>();
  
//   articles.forEach((article) => {
//     article.tags.forEach((tag) => tagsSet.add(tag));
//   });
  
//   return Array.from(tagsSet).sort();
// }
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { unstable_cache } from "next/cache";
import { Article, ArticleMetadata } from "./types";

const articlesDirectory = path.join(process.cwd(), "content/articles");

/* ---------------- RAW FUNCTIONS (NO CACHE) ---------------- */

async function _getArticleBySlug(slug: string): Promise<Article> {
  const fullPath = path.join(articlesDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    ...(data as ArticleMetadata),
    slug,
    content,
    contentHtml,
  };
}

function _getAllArticles(): ArticleMetadata[] {
  const fileNames = fs.readdirSync(articlesDirectory);

  const articles = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, "");
    const fullPath = path.join(articlesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(fileContents);

    return {
      ...(data as ArticleMetadata),
      slug,
    };
  });

  return articles.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

function _getArticlesByTag(tag: string): ArticleMetadata[] {
  return _getAllArticles().filter((a) => a.tags.includes(tag));
}

function _getAllTags(): string[] {
  const tags = new Set<string>();
  _getAllArticles().forEach((a) =>
    a.tags.forEach((t) => tags.add(t))
  );
  return Array.from(tags).sort();
}

/* ---------------- CACHED EXPORTS (USE THESE ONLY) ---------------- */

// ALL ARTICLES
export const getAllArticles = unstable_cache(
  async () => _getAllArticles(),
  ["articles"],
  { tags: ["articles"] }
);

// SINGLE ARTICLE (PER SLUG)
export const getArticleBySlug = (slug: string) =>
  unstable_cache(
    async () => _getArticleBySlug(slug),
    ["article", slug],
    { tags: ["articles", `article:${slug}`] }
  )();

// TAG FILTER
export const getArticlesByTag = (tag: string) =>
  unstable_cache(
    async () => _getArticlesByTag(tag),
    ["tag", tag],
    { tags: ["articles", `tag:${tag}`] }
  )();

// TAG LIST
export const getAllTags = unstable_cache(
  async () => _getAllTags(),
  ["tags"],
  { tags: ["tags", "articles"] }
);
