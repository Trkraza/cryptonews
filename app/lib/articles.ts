import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { Article, ArticleMetadata } from './types';

const articlesDirectory = path.join(process.cwd(), 'content/articles');

export async function getArticleBySlug(slug: string): Promise<Article> {
  const fullPath = path.join(articlesDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  // Convert markdown to HTML
  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    title: data.title || 'Untitled',
    date: data.date || new Date().toISOString().split('T')[0],
    author: data.author || 'Anonymous',
    tags: Array.isArray(data.tags) ? data.tags : [],
    slug: slug,
    excerpt: data.excerpt || '',
    content,
    contentHtml,
  };
}

export function getAllArticles(): ArticleMetadata[] {
  // Check if directory exists
  if (!fs.existsSync(articlesDirectory)) {
    console.warn('Articles directory does not exist:', articlesDirectory);
    return [];
  }

  const fileNames = fs.readdirSync(articlesDirectory);
  
  // Filter only .md files
  const mdFiles = fileNames.filter(file => file.endsWith('.md'));
  
  if (mdFiles.length === 0) {
    console.warn('No markdown files found in:', articlesDirectory);
    return [];
  }

  const articles = mdFiles.map((fileName) => {
    try {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(articlesDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      return {
        title: data.title || 'Untitled',
        date: data.date || new Date().toISOString().split('T')[0],
        author: data.author || 'Anonymous',
        tags: Array.isArray(data.tags) ? data.tags : [],
        slug: slug,
        excerpt: data.excerpt || '',
      };
    } catch (error) {
      console.error(`Error processing file ${fileName}:`, error);
      // Return a safe default instead of crashing
      return {
        title: 'Error Loading Article',
        date: new Date().toISOString().split('T')[0],
        author: 'System',
        tags: ['error'],
        slug: fileName.replace(/\.md$/, ''),
        excerpt: 'This article could not be loaded',
      };
    }
  });

  // Sort by date (newest first)
  return articles.sort((a, b) => {
    try {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } catch {
      return 0;
    }
  });
}

export function getArticlesByTag(tag: string): ArticleMetadata[] {
  const allArticles = getAllArticles();
  return allArticles.filter((article) => {
    // Defensive check
    return Array.isArray(article.tags) && article.tags.includes(tag);
  });
}

export function getAllTags(): string[] {
  const articles = getAllArticles();
  const tagsSet = new Set<string>();
  
  articles.forEach((article) => {
    // Defensive check - only process if tags exist and is an array
    if (article.tags && Array.isArray(article.tags)) {
      article.tags.forEach((tag) => {
        if (tag && typeof tag === 'string') {
          tagsSet.add(tag);
        }
      });
    }
  });
  
  return Array.from(tagsSet).sort();
}