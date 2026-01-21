export interface ArticleMetadata {
  title: string;
  date: string;
  author: string;
  tags: string[];
  slug: string;
  excerpt?: string;
}

export interface Article extends ArticleMetadata {
  content: string;
  contentHtml: string;
}

export interface WebhookPayload {
  ref: string;
  commits: Array<{
    added: string[];
    modified: string[];
    removed: string[];
  }>;
}