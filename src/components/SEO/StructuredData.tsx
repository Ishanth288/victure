
import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  type?: 'WebApplication' | 'SoftwareApplication' | 'Organization' | 'WebPage';
  data?: Record<string, any>;
}

export function StructuredData({ type = 'SoftwareApplication', data }: StructuredDataProps) {
  const getStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type,
    };

    switch (type) {
      case 'SoftwareApplication':
        return {
          ...baseData,
          name: 'Victure',
          applicationCategory: 'BusinessApplication',
          description: 'AI-powered pharmacy management system for inventory, billing, and patient management',
          operatingSystem: 'Web Browser',
          url: 'https://victure.app',
          screenshot: 'https://victure.app/og-image.png',
          softwareVersion: '2.0',
          releaseNotes: 'Enhanced AI features and improved user experience',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free trial available with premium plans starting from ₹999/month',
            availability: 'https://schema.org/InStock'
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            ratingCount: '10000',
            bestRating: '5',
            worstRating: '1'
          },
          author: {
            '@type': 'Organization',
            name: 'Victure',
            url: 'https://victure.app'
          },
          ...data
        };

      case 'Organization':
        return {
          ...baseData,
          name: 'Victure',
          url: 'https://victure.app',
          logo: 'https://victure.app/og-image.png',
          description: 'Leading provider of AI-powered pharmacy management solutions',
          foundingDate: '2023',
          industry: 'Healthcare Technology',
          areaServed: 'India',
          sameAs: [
            'https://www.linkedin.com/company/victure',
            'https://twitter.com/victure_app'
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            email: 'support@victure.app',
            availableLanguage: ['English', 'Hindi']
          },
          ...data
        };

      case 'WebPage':
        return {
          ...baseData,
          name: document.title,
          description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
          url: window.location.href,
          isPartOf: {
            '@type': 'WebSite',
            name: 'Victure',
            url: 'https://victure.app'
          },
          ...data
        };

      default:
        return { ...baseData, ...data };
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(getStructuredData())}
      </script>
    </Helmet>
  );
}
