import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'EDH Builder - MTG Commander Deck Builder',
    template: '%s | EDH Builder',
  },
  description:
    'Build, share, and discover Magic: The Gathering Commander (EDH) decks. Search cards, analyze mana curves, and optimize your deck.',
  keywords: ['MTG', 'Magic the Gathering', 'Commander', 'EDH', 'deck builder', 'deck list'],
  authors: [{ name: 'EDH Builder' }],
  openGraph: {
    title: 'EDH Builder - MTG Commander Deck Builder',
    description: 'Build, share, and discover Magic: The Gathering Commander decks.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
