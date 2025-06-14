
import { Helmet } from 'react-helmet-async';
import { generateKeywords } from '@/utils/seoUtils';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  pageType?: 'home' | 'auth' | 'legal';
  noIndex?: boolean;
  canonicalUrl?: string;
}

export function SEOHead({
  title = "Victure - AI-Powered Pharmacy Management System",
  description = "Transform your pharmacy with Victure's AI-powered management system. Inventory tracking, billing, patient records, and business insights - all in one platform.",
  keywords,
  image = "/og-image.png",
  url = "https://victure.app",
  type = "website",
  pageType = 'home',
  noIndex = false,
  canonicalUrl
}: SEOHeadProps) {
  const fullTitle = title.includes('Victure') ? title : `${title} | Victure`;
  const finalKeywords = keywords || generateKeywords(pageType);
  const finalCanonical = canonicalUrl || url;
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={finalKeywords} />
      <link rel="canonical" href={finalCanonical} />
      
      {/* Robots meta tag */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      )}
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Victure" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@victure_app" />
      <meta name="twitter:creator" content="@victure_app" />
      
      {/* Additional SEO meta tags */}
      <meta name="author" content="Victure" />
      <meta name="publisher" content="Victure" />
      <meta name="application-name" content="Victure" />
      <meta name="theme-color" content="#f97316" />
      <meta name="msapplication-TileColor" content="#f97316" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://www.googletagmanager.com" />
    </Helmet>
  );
}
