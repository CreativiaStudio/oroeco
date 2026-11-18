import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { StorefrontShell } from "@/components/layout/StorefrontShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.oroeco.it"),
  title: {
    default: "ORO&CO | Gioielleria & Alta Orologeria dal 1992",
    template: "%s | ORO&CO Gioielleria",
  },
  description:
    "ORO&CO Gioielleria a San Marzano sul Sarno (SA) dal 1992: gioielli in oro e diamanti, alta orologeria Bulova, Locman e Paul Picot, accessori e oggetti d'arredo. Pezzi certificati e assistenza al banco.",
  keywords: [
    "gioielleria San Marzano sul Sarno",
    "ORO&CO",
    "gioielli oro e diamanti",
    "alta orologeria",
    "Bulova",
    "Locman",
    "Paul Picot",
    "Unoaerre",
    "Lladró",
    "gioielleria Salerno",
  ],
  authors: [{ name: "ORO&CO Gioielleria" }],
  creator: "ORO&CO Gioielleria",
  applicationName: "ORO&CO",
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "ORO&CO Gioielleria",
    title: "ORO&CO | Gioielleria & Alta Orologeria dal 1992",
    description:
      "L'eleganza senza tempo, l'arte dei preziosi. Gioielli, orologi e oggetti d'arte a San Marzano sul Sarno (SA) dal 1992.",
    images: [{ url: "/images/logo-oroeco.jpeg", width: 1600, height: 1600, alt: "ORO&CO Gioielleria" }],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/images/logo-oroeco.jpeg", apple: "/images/logo-oroeco.jpeg" },
};

export const viewport: Viewport = {
  themeColor: "#023351",
  width: "device-width",
  initialScale: 1,
};

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || "G-OROECO2026";
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <head>
        {/* Google Consent Mode v2 Default: DENIED prima di qualsiasi tag di terze parti */}
        <script
          id="google-consent-mode-default"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied',
                'functionality_storage': 'denied',
                'personalization_storage': 'denied',
                'wait_for_update': 500
              });
              gtag('set', 'ads_data_redaction', true);
              gtag('set', 'url_passthrough', true);
            `,
          }}
        />

        {/* Google Tag Manager (opzionale) */}
        {GTM_ID ? (
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${GTM_ID}');
              `,
            }}
          />
        ) : null}

        {/* Google Analytics 4 */}
        {GA4_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA4_ID}', {
                    page_path: window.location.pathname,
                    send_page_view: true
                  });
                `,
              }}
            />
          </>
        ) : null}
      </head>
      <body className="flex min-h-screen flex-col bg-white antialiased">
        <StorefrontShell>{children}</StorefrontShell>
      </body>
    </html>
  );
}
