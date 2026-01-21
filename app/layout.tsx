import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from './components/Header';
import WebhookStatus from './components/WebhookStatus';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CryptoNews - ISR Demo',
  description: 'Learn GitHub Webhooks + ISR with Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <WebhookStatus />
        <footer className="bg-gray-900 text-white py-8 text-center">
          <p>Built with Next.js, ISR, and GitHub Webhooks</p>
        </footer>
      </body>
    </html>
  );
}