import Link from 'next/link';
import { getAllArticles } from './lib/articles';
import ArticleCard from './components/ArticleCard';

export default async function HomePage() {
  const allArticles = await getAllArticles();
  const articles = allArticles.slice(0, 3); // Latest 3 articles

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome to CryptoNews
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Learn ISR + GitHub Webhooks with Next.js
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/articles"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Read Articles
          </Link>
          <Link
            href="https://github.com/yourusername/cryptonews"
            target="_blank"
            className="bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-900 transition"
          >
            View on GitHub
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-3">🚀</div>
          <h3 className="text-xl font-bold mb-2">Instant Updates</h3>
          <p className="text-gray-600">
            Push to GitHub, site updates automatically via webhooks
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-3">⚡</div>
          <h3 className="text-xl font-bold mb-2">ISR Powered</h3>
          <p className="text-gray-600">
            Lightning-fast pages with incremental static regeneration
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="text-xl font-bold mb-2">Markdown Content</h3>
          <p className="text-gray-600">
            Write articles in Markdown, stored in GitHub
          </p>
        </div>
      </div>

      {/* Latest Articles */}
      <div>
        <h2 className="text-3xl font-bold mb-6">Latest Articles</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/articles"
            className="text-blue-600 hover:underline font-semibold"
          >
            View all articles →
          </Link>
        </div>
      </div>
    </div>
  );
}