import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl: string;
  noIndex?: boolean;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  author?: string;
}

export const SEO = ({ 
  title, 
  description, 
  canonicalUrl, 
  noIndex = false,
  keywords,
  ogImage,
  ogType = "website",
  twitterCard = "summary_large_image",
  author
}: SEOProps) => {
  const fullUrl = `${window.location.origin}${canonicalUrl}`;
  const defaultOgImage = `${window.location.origin}/og-image.png`;
  
  return (
    <Helmet>
      {/* Basic SEO */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Keywords */}
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Author */}
      {author && <meta name="author" content={author} />}

      {/* Conditional robots meta */}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage || defaultOgImage} />
      <meta property="og:site_name" content="Victure" />
      
      {/* Twitter */}
      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage || defaultOgImage} />
      
      {/* Additional SEO meta tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />
      <meta name="format-detection" content="telephone=no" />
    </Helmet>
  );
};

