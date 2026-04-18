import type { Metadata, Viewport } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import ClientSideInit from '@/components/shared/ClientSideInit';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CrowdFlow | Real-Time Venue Intelligence',
  description: 'AI-Powered Crowd Management and Navigation Platform for live events, concerts, and stadiums. Real-time density visualization, queue predictions, and smart wayfinding.',
  keywords: ['crowd management', 'venue intelligence', 'real-time density', 'queue prediction', 'wayfinding'],
  robots: 'index, follow',
  authors: [{ name: 'CrowdFlow Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://crowdflow.vision',
    siteName: 'CrowdFlow',
    title: 'CrowdFlow | Real-Time Venue Intelligence',
    description: 'AI-Powered Crowd Management and Navigation Platform.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Placeholder for Google Cloud Monitoring SDK */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-MOCKID"></script>
      </head>
      <body className="antialiased font-sans">
        <ClientSideInit />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-background focus:font-bold">
          Skip to main content
        </a>
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
