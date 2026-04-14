import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Unravel — Knot Untangling Puzzle',
  description: 'Untangle colorful 3D knots in this relaxing puzzle game.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Unravel',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

/**
 * Viewport configuration — critical for mobile gameplay.
 * Disables user-scaling to prevent accidental zoom during touch interactions.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A1A',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * Root layout wrapping all pages.
 * Sets mobile-first meta tags and global font variables.
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="bg-surface-dark text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
