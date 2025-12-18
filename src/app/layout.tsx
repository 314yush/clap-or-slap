import type { Metadata, Viewport } from 'next';
import { Space_Grotesk } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PrivyProvider } from '@/components/providers/PrivyProvider';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://caporslap.com';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'CapOrSlap - Higher or Lower for Crypto',
    description: 'Guess if the next token has a higher or lower market cap. Build streaks, compete globally.',
    keywords: ['crypto', 'game', 'market cap', 'higher lower', 'tokens', 'defi'],
    authors: [{ name: 'CapOrSlap' }],
    openGraph: {
      title: 'CapOrSlap',
      description: 'Can you guess the market cap? Play now!',
      type: 'website',
      images: [
        {
          url: `${APP_URL}/images/miniapp/hero-1200x630.png`,
          width: 1200,
          height: 630,
          alt: 'CapOrSlap - Higher or Lower for Crypto',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'CapOrSlap',
      description: 'Can you guess the market cap? Play now!',
      images: [`${APP_URL}/images/miniapp/hero-1200x630.png`],
    },
    // Farcaster Mini-App metadata
    other: {
      'fc:miniapp': JSON.stringify({
        version: 'next',
        imageUrl: `${APP_URL}/images/miniapp/hero-1200x630.png`,
        button: {
          title: 'Launch CapOrSlap',
          action: {
            type: 'launch_miniapp',
            name: 'CapOrSlap',
            url: APP_URL,
            splashImageUrl: `${APP_URL}/images/miniapp/splash-1200.png`,
            splashBackgroundColor: '#09090b',
          },
        },
      }),
    },
  };
}

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
        <PrivyProvider>
          {children}
        </PrivyProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
