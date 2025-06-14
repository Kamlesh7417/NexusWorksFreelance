import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NexusWorks - Where Learning Meets Earning',
  description: 'The World\'s First Work-to-Earn Freelancing Platform with AI Enhancement & Blockchain Payments',
  keywords: 'work to earn platform, AI freelancing, student cryptocurrency earning, blockchain payments, freelance marketplace',
  authors: [{ name: 'NexusWorks Team' }],
  openGraph: {
    title: 'NexusWorks - Where Learning Meets Earning',
    description: 'The World\'s First Work-to-Earn Freelancing Platform with AI Enhancement & Blockchain Payments',
    url: 'https://nexusworks.com',
    siteName: 'NexusWorks',
    images: [
      {
        url: 'https://nexusworks.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NexusWorks - The Future of Freelancing'
      }
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexusWorks - Where Learning Meets Earning',
    description: 'The World\'s First Work-to-Earn Freelancing Platform with AI Enhancement & Blockchain Payments',
    images: ['https://nexusworks.com/twitter-image.jpg'],
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#00e6ff" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}