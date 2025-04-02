import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, Code, FileText } from 'lucide-react';
import { WhatsAppButton } from '@/components/communication/WhatsAppButton';

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

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4">Documentation Center</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore our comprehensive guides, tutorials, and API documentation to get the most out of Victure PharmEase.
        </p>
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
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Learn how to set up your pharmacy account, configure your dashboard, and start managing your pharmacy with Victure PharmEase.</p>
                  <Button className="mt-4" variant="outline">Read Guide</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="api">
            <div className="prose max-w-none">
              <h2>API Overview</h2>
              <p>Our REST API allows you to integrate Victure PharmEase with your existing systems. Use our authentication endpoints to generate API keys and access tokens.</p>
              
              <h3>Authentication</h3>
              <p>All API requests require authentication using Bearer tokens...</p>
              
              <h3>Rate Limiting</h3>
              <p>API calls are limited to 100 requests per minute per API key...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="release-notes">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-2">Version 2.0.0 (June 1, 2023)</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Added AI-powered inventory forecasting</li>
                  <li>Improved dashboard with real-time analytics</li>
                  <li>New mobile app for on-the-go pharmacy management</li>
                  <li>Performance improvements and bug fixes</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-2">Version 1.5.2 (March 15, 2023)</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Fixed issue with billing calculations</li>
                  <li>Added support for multiple pharmacies under one account</li>
                  <li>Improved search functionality</li>
                </ul>
              </div>
            </div>
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
