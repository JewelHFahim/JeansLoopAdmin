import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'JeansLoop / Admin Terminal',
  description: 'JeansLoop Management & Operations Command Console',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-black" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
