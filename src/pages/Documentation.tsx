
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
        title: 'Getting Started with Victure PharmEase',
        category: 'guides',
        excerpt: 'Learn how to set up your pharmacy account and dashboard...',
        url: '#getting-started'
      },
      {
        id: 2,
        title: 'Inventory Management System',
        category: 'guides',
        excerpt: 'Comprehensive guide to managing your pharmacy inventory...',
        url: '#inventory'
      },
      {
        id: 3,
        title: 'REST API Documentation',
        category: 'api',
        excerpt: 'Learn how to integrate with our REST API endpoints...',
        url: '#api'
      },
      {
        id: 4, 
        title: 'Billing System Configuration',
        category: 'guides',
        excerpt: 'Set up your billing system with our built-in tools...',
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
        title: 'Authentication',
        excerpt: 'Secure your API requests with our authentication system',
        content: 'Our REST API uses Bearer token authentication. Get your API key from the Settings page.',
        tags: ['api', 'security', 'authentication'],
        category: 'API',
        updatedAt: '2023-11-15',
        readTime: 5
      },
      {
        id: 'api-2',
        title: 'Inventory Endpoints',
        excerpt: 'Manage your inventory programmatically',
        content: 'Use these endpoints to create, read, update and delete inventory items.',
        tags: ['api', 'inventory', 'REST'],
        category: 'API',
        updatedAt: '2023-10-20',
        readTime: 8
      }
    ],
    guides: [
      {
        id: 'guide-1',
        title: 'First-time Setup Guide',
        excerpt: 'Complete walkthrough for new pharmacy owners',
        content: 'This comprehensive guide will walk you through setting up your pharmacy profile, configuring your inventory, and processing your first prescription.',
        tags: ['setup', 'configuration', 'beginners'],
        category: 'Guides',
        updatedAt: '2023-12-10',
        readTime: 12
      },
      {
        id: 'guide-2',
        title: 'Prescription Management',
        excerpt: 'Learn how to handle digital prescriptions',
        content: 'This guide explains how to receive, verify, fill, and track prescriptions in the system.',
        tags: ['prescriptions', 'workflow', 'intermediate'],
        category: 'Guides',
        updatedAt: '2023-11-25',
        readTime: 10
      },
      {
        id: 'guide-3',
        title: 'Managing Patient Records',
        excerpt: 'Best practices for patient data management',
        content: 'Learn how to create, update, and maintain patient records while ensuring compliance with healthcare regulations.',
        tags: ['patients', 'compliance', 'data-management'],
        category: 'Guides',
        updatedAt: '2023-10-15',
        readTime: 9
      }
    ],
    notes: [
      {
        id: 'note-1',
        title: 'Version 2.1.0 Release Notes',
        excerpt: 'Major update with new features and improvements',
        content: 'This release includes a redesigned dashboard, improved inventory forecasting, and new billing integration options.',
        tags: ['release', 'update', 'features'],
        category: 'Release Notes',
        updatedAt: '2023-12-05',
        readTime: 7
      },
      {
        id: 'note-2',
        title: 'Security Update 1.9.5',
        excerpt: 'Critical security patches and enhancements',
        content: 'This update addresses several security vulnerabilities and improves data encryption throughout the application.',
        tags: ['security', 'update', 'critical'],
        category: 'Release Notes',
        updatedAt: '2023-11-01',
        readTime: 4
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
            Explore our comprehensive guides, tutorials, and API documentation to get the most out of Victure PharmEase.
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
              <span>User Guides</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <span>API Reference</span>
            </TabsTrigger>
            <TabsTrigger value="release-notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Release Notes</span>
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
            <h3 className="font-semibold text-lg">Need help with implementation?</h3>
            <p className="text-muted-foreground">Our technical support team is available to assist you.</p>
          </div>
          <div className="flex gap-4">
            <WhatsAppButton 
              phoneNumber="9390621556" 
              buttonText="Contact Support"
              className="min-w-[150px]"
            />
            <Button variant="outline">Email Support</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
