import Link from 'next/link';
import { ArticleMetadata } from '../lib/types';

interface ArticleCardProps {
  article: ArticleMetadata;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link href={`/articles/${article.slug}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-6 h-full border border-gray-200 hover:border-blue-500">
        <h2 className="text-2xl font-bold mb-3 text-gray-900 hover:text-blue-600 transition">
          {article.title}
        </h2>
        
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          <span>📅 {new Date(article.date).toLocaleDateString()}</span>
          <span>✍️ {article.author}</span>
        </div>
        
        {article.excerpt && (
          <p className="text-gray-700 mb-4 line-clamp-3">
            {article.excerpt}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}