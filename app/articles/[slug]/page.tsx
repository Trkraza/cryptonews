// import { getArticleBySlug, getAllArticles } from '@/app/lib/articles';
// import Link from 'next/link';
// import { notFound } from 'next/navigation';
// export const dynamicParams = true;
// // export const revalidate = 3600;

// // Generate static paths
// export async function generateStaticParams() {
//   const articles = await getAllArticles();
//   return articles.map((article) => ({
//     slug: article.slug,
//   }));
// }

// // Generate metadata
// export async function generateMetadata({ params }: { params: { slug: string } }) {
//   try {
//     const article = await getArticleBySlug(params.slug);
//     return {
//       title: `${article.title} | CryptoNews`,
//       description: article.excerpt || article.title,
//     };
//   } catch {
//     return {
//       title: 'Article Not Found',
//     };
//   }
// }

// export default async function ArticlePage({ params }: { params: { slug: string } }) {
//   let article;
  
//   try {
//     article = await getArticleBySlug(params.slug);
//   } catch {
//     notFound();
//   }

//   return (
//     <div className="max-w-4xl mx-auto px-4 py-12">
//       <Link
//         href="/articles"
//         className="text-blue-600 hover:underline mb-6 inline-block"
//       >
//         ← Back to all articles
//       </Link>

//       <article className="bg-white rounded-lg shadow-lg p-8">
//         <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
        
//         <div className="flex items-center gap-4 mb-6 text-gray-600 pb-6 border-b">
//           <span>📅 {new Date(article.date).toLocaleDateString()}</span>
//           <span>✍️ {article.author}</span>
//         </div>

//         <div className="flex flex-wrap gap-2 mb-8">
//           {article.tags.map((tag) => (
//             <Link
//               key={tag}
//               href={`/articles/tag/${tag}`}
//               className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition"
//             >
//               #{tag}
//             </Link>
//           ))}
//         </div>

//         <div
//           className="prose max-w-none"
//           dangerouslySetInnerHTML={{ __html: article.contentHtml }}
//         />
//       </article>

//       {/* ISR Info */}
//       <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
//         <p className="text-green-800">
//           ⚡ This page was statically generated with ISR and updates automatically via webhooks
//         </p>
//       </div>
//     </div>
//   );
// }
import { getArticleBySlug, getAllArticles } from "@/app/lib/articles";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const dynamicParams = true;


// Generate static paths
// export async function generateStaticParams() {
//   const articles = await getAllArticles();
//   return articles.map((article) => ({
//     slug: article.slug,
//   }));
// }

// ✅ FIX: params is a Promise
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const article = await getArticleBySlug(slug);
    return {
      title: `${article.title} | CryptoNews`,
      description: article.excerpt || article.title,
    };
  } catch {
    return {
      title: "Article Not Found",
    };
  }
}

// ✅ FIX: params is a Promise
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let article;
  try {
    article = await getArticleBySlug(slug);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link
        href="/articles"
        className="text-blue-600 hover:underline mb-6 inline-block"
      >
        ← Back to all articles
      </Link>

      <article className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

        <div className="flex items-center gap-4 mb-6 text-gray-600 pb-6 border-b">
          <span>📅 {new Date(article.date).toLocaleDateString()}</span>
          <span>✍️ {article.author}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {article.tags.map((tag: string) => (
            <Link
              key={tag}
              href={`/articles/tag/${tag}`}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition"
            >
              #{tag}
            </Link>
          ))}
        </div>

        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />
      </article>
    </div>
  );
}
