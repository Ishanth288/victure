
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, Code, FileText, Home } from 'lucide-react';
import { WhatsAppButton } from '@/components/communication/WhatsAppButton';
import { Link } from 'react-router-dom';
import { SearchableKnowledgeBase } from '@/components/documentation/SearchableKnowledgeBase';

export default function Documentation() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('guides');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    const mockResults = [
      {
        id: 1,
        title: 'Getting Started with Victure',
        category: 'guides',
        excerpt: 'Learn how to set up your pharmacy account and dashboard in Victure...',
        url: '#getting-started'
      },
      {
        id: 2,
        title: 'Smart Inventory Management',
        category: 'guides',
        excerpt: 'AI-powered inventory tracking and automated reorder alerts...',
        url: '#inventory'
      },
      {
        id: 3,
        title: 'Patient Management System',
        category: 'guides',
        excerpt: 'Manage patient records, prescriptions, and medical history...',
        url: '#patients'
      },
      {
        id: 4, 
        title: 'Billing & Analytics',
        category: 'guides',
        excerpt: 'Generate bills, track revenue, and analyze business insights...',
        url: '#billing'
      }
    ].filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setSearchResults(mockResults);
  }, [searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchTerm);
  };

  const pharmacyDocsData = {
    api: [
      {
        id: 'api-1',
        title: 'Getting Started with Victure',
        excerpt: 'Complete setup guide for your pharmacy management system',
        content: 'Learn how to create your account, set up your pharmacy profile, and configure initial settings. This guide covers user registration, pharmacy information setup, and basic navigation through the Victure dashboard.',
        tags: ['setup', 'getting-started', 'configuration'],
        category: 'Getting Started',
        updatedAt: '2024-01-15',
        readTime: 8
      },
      {
        id: 'api-2',
        title: 'Dashboard Overview',
        excerpt: 'Understanding your Victure dashboard and key metrics',
        content: 'Navigate through the main dashboard to view real-time analytics, inventory alerts, recent transactions, and business insights. Learn how to customize your dashboard view and interpret key performance indicators.',
        tags: ['dashboard', 'analytics', 'overview'],
        category: 'Getting Started',
        updatedAt: '2024-01-10',
        readTime: 6
      }
    ],
    guides: [
      {
        id: 'guide-1',
        title: 'Smart Inventory Management',
        excerpt: 'AI-powered inventory tracking and optimization',
        content: 'Master Victure\'s intelligent inventory system. Learn how to add medicines, track stock levels, set up automated reorder alerts, manage expiry dates, and use AI-powered demand forecasting to optimize your inventory.',
        tags: ['inventory', 'ai', 'automation', 'stock-management'],
        category: 'Core Features',
        updatedAt: '2024-01-12',
        readTime: 15
      },
      {
        id: 'guide-2',
        title: 'Patient Management System',
        excerpt: 'Comprehensive patient record management',
        content: 'Learn how to create and manage patient profiles, track medical history, manage prescriptions, and maintain HIPAA-compliant records. Includes features for patient search, visit tracking, and prescription history.',
        tags: ['patients', 'records', 'prescriptions', 'compliance'],
        category: 'Core Features',
        updatedAt: '2024-01-08',
        readTime: 12
      },
      {
        id: 'guide-3',
        title: 'Billing & Revenue Tracking',
        excerpt: 'Streamlined billing and financial analytics',
        content: 'Generate professional bills, track payments, manage insurance claims, and analyze revenue trends. Learn about automated billing features, payment tracking, and comprehensive financial reporting.',
        tags: ['billing', 'revenue', 'analytics', 'payments'],
        category: 'Core Features',
        updatedAt: '2024-01-05',
        readTime: 10
      },
      {
        id: 'guide-4',
        title: 'Business Insights & Analytics',
        excerpt: 'Data-driven decision making for your pharmacy',
        content: 'Utilize Victure\'s advanced analytics to understand sales patterns, inventory turnover, customer behavior, and profitability. Learn how to generate reports and use insights to grow your pharmacy business.',
        tags: ['analytics', 'insights', 'reports', 'business-intelligence'],
        category: 'Advanced Features',
        updatedAt: '2024-01-03',
        readTime: 14
      }
    ],
    notes: [
      {
        id: 'note-1',
        title: 'Latest Updates & Features',
        excerpt: 'Recent improvements and new capabilities',
        content: 'Stay updated with the latest features including enhanced AI inventory predictions, improved mobile responsiveness, advanced analytics dashboard, and streamlined billing workflows.',
        tags: ['updates', 'features', 'improvements'],
        category: 'What\'s New',
        updatedAt: '2024-01-15',
        readTime: 6
      },
      {
        id: 'note-2',
        title: 'Security & Compliance',
        excerpt: 'Data protection and healthcare compliance',
        content: 'Learn about Victure\'s security measures, HIPAA compliance features, data encryption, user access controls, and best practices for maintaining patient data privacy.',
        tags: ['security', 'compliance', 'privacy', 'hipaa'],
        category: 'Security',
        updatedAt: '2024-01-01',
        readTime: 8
      },
      {
        id: 'note-3',
        title: 'Mobile App Features',
        excerpt: 'Manage your pharmacy on the go',
        content: 'Discover Victure\'s mobile capabilities including inventory scanning, quick billing, patient lookup, and real-time notifications. Perfect for busy pharmacy owners who need access anywhere.',
        tags: ['mobile', 'scanning', 'notifications'],
        category: 'Mobile',
        updatedAt: '2023-12-28',
        readTime: 7
      }
    ]
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-6 flex items-center">
        <Link to="/" className="mr-4">
          <Button variant="ghost" size="icon">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Documentation Center</h1>
          <p className="text-muted-foreground">
            Explore our comprehensive guides, tutorials, and API documentation to get the most out of Victure - your AI-powered pharmacy management system.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mb-10">
        <form onSubmit={handleSearch} className="relative">
          <Input
            placeholder="Search documentation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
          <Button 
            type="submit" 
            size="sm" 
            variant="ghost" 
            className="absolute right-0 top-0 h-full px-3"
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {searchResults.length > 0 && (
        <div className="max-w-3xl mx-auto mb-10">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          <div className="space-y-4">
            {searchResults.map((result) => (
              <Card key={result.id}>
                <CardContent className="p-4">
                  <h3 className="font-medium">
                    <a href={result.url} className="text-primary hover:underline">
                      {result.title}
                    </a>
                  </h3>
                  <p className="text-muted-foreground text-sm">{result.excerpt}</p>
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 text-xs bg-muted rounded-full">
                      {result.category === 'guides' ? 'User Guide' : 'API Documentation'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="guides" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Feature Guides</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <span>Getting Started</span>
            </TabsTrigger>
            <TabsTrigger value="release-notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Updates & Info</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="guides">
            <SearchableKnowledgeBase initialArticles={pharmacyDocsData.guides} />
          </TabsContent>
          
          <TabsContent value="api">
            <SearchableKnowledgeBase initialArticles={pharmacyDocsData.api} />
          </TabsContent>
          
          <TabsContent value="release-notes">
            <SearchableKnowledgeBase initialArticles={pharmacyDocsData.notes} />
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="max-w-4xl mx-auto mt-16 border-t pt-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">Need help getting started?</h3>
            <p className="text-muted-foreground">Our team is here to help you maximize your pharmacy's potential with Victure.</p>
          </div>
          <div className="flex gap-4">
            <WhatsAppButton 
              phoneNumber="9390621556" 
              buttonText="Get Support"
              className="min-w-[150px]"
            />
            <Button variant="outline" onClick={() => window.location.href = 'mailto:support@victure.in'}>Email Support</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
