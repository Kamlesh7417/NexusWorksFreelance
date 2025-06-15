'use client';

import Head from 'next/head';

interface SEOMetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  noIndex?: boolean;
  children?: React.ReactNode;
}

export function SEOMeta({
  title = 'NexusWorks - The Future of Freelancing',
  description = 'Connect with elite developers, leverage blockchain security, and build tomorrow\'s technology today.',
  keywords = 'freelance, quantum computing, AI, blockchain, developers, projects, remote work',
  ogImage = 'https://nexusworks.in/og-image.jpg',
  ogUrl = 'https://nexusworks.in',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noIndex = false,
  children
}: SEOMetaProps) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={ogUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={ogUrl} />
      
      {/* No index if specified */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Additional meta tags */}
      {children}
    </Head>
  );
}