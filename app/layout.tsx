import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth/auth-provider';
import { ToastProvider } from '@/components/ui/toast-provider';
import { Analytics } from '@/components/analytics/analytics';
import { ServiceWorkerRegistration } from '@/components/ui/service-worker';
import { HelpCenter } from '@/components/ui/help-center';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export const metadata: Metadata = {
  title: 'NexusWorks - Futuristic Freelance Platform',
  description: 'The Future of Freelancing with Holographic Immersion & AI Integration',
  keywords: 'freelance, quantum computing, AI, blockchain, developers, projects, remote work',
  authors: [{ name: 'NexusWorks Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nexusworks.in',
    title: 'NexusWorks - The Future of Freelancing',
    description: 'Connect with elite developers, leverage blockchain security, and build tomorrow\'s technology today.',
    siteName: 'NexusWorks',
    images: [
      {
        url: 'https://nexusworks.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NexusWorks Platform'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexusWorks - The Future of Freelancing',
    description: 'Connect with elite developers, leverage blockchain security, and build tomorrow\'s technology today.',
    images: ['https://nexusworks.in/og-image.jpg']
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#080810" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              {children}
              <HelpCenter />
            </ToastProvider>
          </AuthProvider>
          <ServiceWorkerRegistration />
          <Analytics />
        </ErrorBoundary>
      </body>
    </html>
  );
}