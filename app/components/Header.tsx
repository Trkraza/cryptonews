import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-3xl font-bold hover:opacity-80 transition">
            📰 CryptoNews
          </Link>
          <nav className="flex gap-6">
            <Link href="/articles" className="hover:underline">
              Articles
            </Link>
            <a 
              href="https://github.com/yourusername/cryptonews" 
              target="_blank"
              className="hover:underline"
            >
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}