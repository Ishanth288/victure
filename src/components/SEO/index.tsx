import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl: string;
  noIndex?: boolean;
}

export const SEO = ({ title, description, canonicalUrl, noIndex = false }: SEOProps) => {
  return (
    <Helmet>
      {/* Basic SEO */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Conditional robots meta */}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
    </Helmet>
  );
};

