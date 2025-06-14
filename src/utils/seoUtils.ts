
export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const sitemapUrls: SitemapUrl[] = [
  {
    loc: 'https://victure.in/',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 1.0
  },
  {
    loc: 'https://victure.in/auth',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.6
  },
  {
    loc: 'https://victure.in/insights',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.8
  },
  {
    loc: 'https://victure.in/patients',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.7
  },
  {
    loc: 'https://victure.in/inventory',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.7
  },
  {
    loc: 'https://victure.in/prescriptions',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.7
  },
  {
    loc: 'https://victure.in/billing',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.7
  },
  {
    loc: 'https://victure.in/legal/privacy-policy',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'yearly',
    priority: 0.3
  },
  {
    loc: 'https://victure.in/legal/terms-of-service',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'yearly',
    priority: 0.3
  },
  {
    loc: 'https://victure.in/legal/refund-policy',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'yearly',
    priority: 0.3
  }
];

export const generateXMLSitemap = (urls: SitemapUrl[]): string => {
  const urlElements = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
};

// Keywords for different pages
export const pageKeywords = {
  home: [
    'pharmacy management software',
    'inventory management system',
    'prescription billing software',
    'AI-powered pharmacy management',
    'pharmacy POS system',
    'medical inventory tracking',
    'pharmacy automation software',
    'healthcare management system',
    'pharmacy billing system',
    'inventory optimization'
  ],
  auth: [
    'pharmacy software login',
    'secure pharmacy management',
    'pharmacy system access'
  ],
  legal: [
    'pharmacy software terms',
    'healthcare software privacy',
    'medical software compliance'
  ]
};

export const generateKeywords = (page: keyof typeof pageKeywords): string => {
  return pageKeywords[page].join(', ');
};
