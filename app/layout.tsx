import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TextOverlayed - Professional Image Editing with Text Overlays',
  description: 'Create stunning images with customizable text overlays. Upload, edit, and export high-quality images with our professional SaaS platform.',
  keywords: 'image editor, text overlay, image editing, SaaS, design tools',
  authors: [{ name: 'TextOverlayed Team' }],
  creator: 'TextOverlayed',
  publisher: 'TextOverlayed',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'TextOverlayed - Professional Image Editing with Text Overlays',
    description: 'Create stunning images with customizable text overlays. Upload, edit, and export high-quality images.',
    url: '/',
    siteName: 'TextOverlayed',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TextOverlayed - Professional Image Editing Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TextOverlayed - Professional Image Editing with Text Overlays',
    description: 'Create stunning images with customizable text overlays. Upload, edit, and export high-quality images.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <div className="min-h-screen bg-background">
            {children}
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--background)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
} 