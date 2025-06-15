import Head from 'next/head';

interface SeoMetaProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'article' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image';
  noIndex?: boolean;
  canonicalUrl?: string;
}

export function SeoMeta({
  title,
  description,
  keywords,
  ogImage = 'https://nexusworks.in/og-image.jpg',
  ogUrl,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noIndex = false,
  canonicalUrl,
}: SeoMetaProps) {
  const fullTitle = `${title} | NexusWorks`;
  
  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      <meta property="og:site_name" content="NexusWorks" />
      
      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* No Index */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Structured Data for Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'NexusWorks',
            url: 'https://nexusworks.in',
            logo: 'https://nexusworks.in/logo.png',
            sameAs: [
              'https://twitter.com/nexusworks',
              'https://linkedin.com/company/nexusworks',
              'https://github.com/nexusworks'
            ],
            description: 'The Future of Freelancing with Holographic Immersion & AI Integration'
          })
        }}
      />
    </Head>
  );
}