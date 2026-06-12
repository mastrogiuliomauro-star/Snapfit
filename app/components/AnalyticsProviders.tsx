"use client";

import Script from "next/script";

export default function AnalyticsProviders() {
    return (
        <>
            {/* --- GOOGLE ANALYTICS 4 --- */}
            <Script
                src="https://www.googletagmanager.com/gtag/js?id=G-QG64Z6EEXL"
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-QG64Z6EEXL', {
            page_path: window.location.pathname,
          });
        `}
            </Script>
        </>
    );
}