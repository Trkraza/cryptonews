import { getArticlesByTag, getAllTags } from '@/app/lib/articles';
import ArticleCard from '@/app/components/ArticleCard';
import Link from 'next/link';

// export const revalidate = 3600;

// export async function generateStaticParams() {
//   const tags = await getAllTags();
//   return tags.map((tag) => ({
//     tag,
//   }));
// }
export const dynamic = "force-static";
export const dynamicParams = true;

export default async function TagPage({ params }: { params: { tag: string } }) {
  const articles = await getArticlesByTag(params.tag);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Link
        href="/articles"
        className="text-blue-600 hover:underline mb-6 inline-block"
      >
        ← Back to all articles
      </Link>

      <h1 className="text-4xl font-bold mb-2">
        Articles tagged: <span className="text-blue-600">#{params.tag}</span>
      </h1>
      <p className="text-gray-600 mb-8">
        {articles.length} article{articles.length !== 1 ? 's' : ''} found
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}