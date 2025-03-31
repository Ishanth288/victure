
import { useState, useEffect } from 'react';
import { Search, BookOpen, ChevronRight, ChevronDown, Tag, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  category: string;
  updatedAt: string;
  readTime: number;
}

interface KnowledgeBaseProps {
  initialArticles?: Article[];
}

export function SearchableKnowledgeBase({ initialArticles = [] }: KnowledgeBaseProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>(initialArticles);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - replace with actual API call
  useEffect(() => {
    if (initialArticles.length === 0) {
      setIsLoading(true);
      
      // Simulate API call with timeout
      const timer = setTimeout(() => {
        const mockArticles: Article[] = [
          {
            id: '1',
            title: 'Getting Started with Victure PharmEase',
            excerpt: 'Learn how to set up and configure your Victure PharmEase system.',
            content: 'This is the full content of the article that explains how to get started...',
            tags: ['setup', 'onboarding', 'configuration'],
            category: 'Getting Started',
            updatedAt: '2023-11-15',
            readTime: 5
          },
          {
            id: '2',
            title: 'Troubleshooting Common Issues',
            excerpt: 'Solutions for the most frequently encountered problems.',
            content: 'This guide covers common issues and their solutions...',
            tags: ['troubleshooting', 'errors', 'support'],
            category: 'Support',
            updatedAt: '2023-12-01',
            readTime: 8
          },
          {
            id: '3',
            title: 'Inventory Management Best Practices',
            excerpt: 'Optimize your inventory management workflow.',
            content: 'Follow these best practices to ensure efficient inventory management...',
            tags: ['inventory', 'management', 'optimization'],
            category: 'Features',
            updatedAt: '2023-10-20',
            readTime: 7
          },
          {
            id: '4',
            title: 'Reporting and Analytics Guide',
            excerpt: 'Learn how to use the reporting and analytics tools.',
            content: 'This guide explains how to generate and interpret various reports...',
            tags: ['reports', 'analytics', 'data'],
            category: 'Features',
            updatedAt: '2023-11-05',
            readTime: 10
          },
          {
            id: '5',
            title: 'User Management and Permissions',
            excerpt: 'Configure user roles and access levels.',
            content: 'Learn how to set up user accounts and manage permissions...',
            tags: ['users', 'security', 'permissions'],
            category: 'Administration',
            updatedAt: '2023-09-15',
            readTime: 6
          },
          {
            id: '6',
            title: 'System Requirements',
            excerpt: 'Hardware and software requirements for optimal performance.',
            content: 'Ensure your system meets these requirements for the best experience...',
            tags: ['requirements', 'installation', 'performance'],
            category: 'Getting Started',
            updatedAt: '2023-08-10',
            readTime: 3
          }
        ];
        
        setArticles(mockArticles);
        setFilteredArticles(mockArticles);
        setIsLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [initialArticles]);

  // Filter articles based on search, category, and tags
  useEffect(() => {
    let results = articles;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(article => 
        article.title.toLowerCase().includes(query) || 
        article.excerpt.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    if (activeCategory) {
      results = results.filter(article => article.category === activeCategory);
    }
    
    if (activeTags.length > 0) {
      results = results.filter(article => 
        activeTags.some(tag => article.tags.includes(tag))
      );
    }
    
    setFilteredArticles(results);
  }, [searchQuery, activeCategory, activeTags, articles]);

  // Get unique categories from articles
  const categories = [...new Set(articles.map(article => article.category))];
  
  // Get all unique tags
  const allTags = [...new Set(articles.flatMap(article => article.tags))];
  
  // Toggle category open/closed state
  const toggleCategory = (category: string) => {
    setOpenCategories(prevOpen => 
      prevOpen.includes(category) 
        ? prevOpen.filter(c => c !== category)
        : [...prevOpen, category]
    );
  };
  
  // Handle category selection
  const handleCategoryClick = (category: string) => {
    setActiveCategory(prevCategory => 
      prevCategory === category ? null : category
    );
  };
  
  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setActiveTags(prevTags =>
      prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag]
    );
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setActiveCategory(null);
    setActiveTags([]);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {/* Sidebar filters */}
      <div className="md:col-span-1 space-y-6">
        <div className="sticky top-4">
          <div className="mb-6">
            <h3 className="font-medium mb-2">Search Knowledge Base</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search articles..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Categories</h3>
            <div className="space-y-1">
              {categories.map(category => (
                <Collapsible 
                  key={category} 
                  open={openCategories.includes(category)}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <div className="flex items-center">
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-1 mr-1"
                        aria-label={`Toggle ${category} category`}
                      >
                        {openCategories.includes(category) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`justify-start h-auto px-2 py-1 text-left w-full ${
                        activeCategory === category ? 'bg-primary/10 text-primary' : ''
                      }`}
                      onClick={() => handleCategoryClick(category)}
                    >
                      {category} ({articles.filter(a => a.category === category).length})
                    </Button>
                  </div>
                  <CollapsibleContent className="ml-6 mt-1">
                    <ul className="space-y-1">
                      {articles
                        .filter(article => article.category === category)
                        .map(article => (
                          <li key={article.id}>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="justify-start h-auto px-2 py-1 text-left w-full text-sm"
                              onClick={() => setSelectedArticle(article)}
                            >
                              {article.title}
                            </Button>
                          </li>
                        ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <Badge 
                  key={tag}
                  variant={activeTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          {(searchQuery || activeCategory || activeTags.length > 0) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="mt-4"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className="md:col-span-2 lg:col-span-3">
        {selectedArticle ? (
          <div className="bg-white rounded-lg shadow p-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedArticle(null)}
              className="mb-4"
            >
              ← Back to Articles
            </Button>
            
            <h1 className="text-2xl font-bold mb-2">{selectedArticle.title}</h1>
            
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <Clock className="h-4 w-4 mr-1" />
              <span className="mr-4">{selectedArticle.readTime} min read</span>
              <Tag className="h-4 w-4 mr-1" />
              <div className="flex flex-wrap gap-2">
                {selectedArticle.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 rounded-full px-2 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="prose max-w-none">
              <p className="font-medium text-gray-700 mb-4">{selectedArticle.excerpt}</p>
              <p className="text-gray-600">{selectedArticle.content}</p>
              {/* Add more formatted content here */}
            </div>
            
            <div className="mt-8 pt-6 border-t text-sm text-gray-500">
              Last updated: {new Date(selectedArticle.updatedAt).toLocaleDateString()}
            </div>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded mb-1 w-full"></div>
                <div className="h-4 bg-gray-200 rounded mb-3 w-5/6"></div>
                <div className="flex gap-2">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">No articles found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
            <Button onClick={clearFilters}>Clear All Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map(article => (
              <Card key={article.id} className="h-full">
                <CardHeader>
                  <CardTitle>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-lg font-semibold text-left justify-start hover:no-underline"
                      onClick={() => setSelectedArticle(article)}
                    >
                      {article.title}
                    </Button>
                  </CardTitle>
                  <CardDescription>{article.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{article.readTime} min read</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary flex items-center gap-1"
                    onClick={() => setSelectedArticle(article)}
                  >
                    Read <ChevronRight className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
