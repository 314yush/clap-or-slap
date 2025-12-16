import type { Metadata, Viewport } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CapOrSlap - Higher or Lower for Crypto',
  description: 'Guess if the next token has a higher or lower market cap. Build streaks, compete globally.',
  keywords: ['crypto', 'game', 'market cap', 'higher lower', 'tokens', 'defi'],
  authors: [{ name: 'CapOrSlap' }],
  openGraph: {
    title: 'CapOrSlap',
    description: 'Can you guess the market cap? Play now!',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CapOrSlap',
    description: 'Can you guess the market cap? Play now!',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} font-sans antialiased bg-zinc-950 text-white`}
      >
        {children}
      </body>
    </html>
  );
}
