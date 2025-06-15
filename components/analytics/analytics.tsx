'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window.gtag === 'undefined') return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    window.gtag('config', 'G-MEASUREMENT_ID', {
      page_path: url,
    });
  }, [pathname, searchParams]);

  return (
    <>
      {/* Google Analytics Script - Replace G-MEASUREMENT_ID with your actual ID in production */}
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=G-MEASUREMENT_ID`}
        data-nscript="afterInteractive"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MEASUREMENT_ID', {
              page_path: window.location.pathname,
            });
          `,
        }}
        data-nscript="afterInteractive"
      />
    </>
  );
}