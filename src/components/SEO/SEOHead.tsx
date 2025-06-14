
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function SEOHead({
  title = "Victure - AI-Powered Pharmacy Management System",
  description = "Transform your pharmacy with Victure's AI-powered management system. Inventory tracking, billing, patient records, and business insights - all in one platform.",
  keywords = "pharmacy management, inventory software, billing system, patient records, pharmacy automation",
  image = "/og-image.png",
  url = "https://victure.app",
  type = "website"
}: SEOHeadProps) {
  const fullTitle = title.includes('Victure') ? title : `${title} | Victure`;
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
