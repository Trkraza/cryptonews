import { getAllArticles, getAllTags } from '../lib/articles';
import ArticleCard from '../components/ArticleCard';
import Link from 'next/link';

// export const revalidate = 3600; // Revalidate every hour
export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const articles = await getAllArticles();
  const tags = await getAllTags();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">All Articles</h1>
      <p className="text-gray-600 mb-8">
        {articles.length} articles published
      </p>

      {/* Tags Filter */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h3 className="font-semibold mb-3">Filter by tag:</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/articles/tag/${tag}`}
              className="px-3 py-1 bg-gray-100 hover:bg-blue-100 text-gray-800 hover:text-blue-800 rounded-full text-sm transition"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>

      {/* ISR Info */}
      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-bold text-lg mb-2">🔄 How this works:</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✅ Articles stored as Markdown files in GitHub</li>
          <li>✅ ISR revalidates this page every hour (fallback)</li>
          <li>✅ Webhooks trigger instant updates on push</li>
          <li>✅ No manual rebuild needed!</li>
        </ul>
      </div>
    </div>
  );
}