
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchResult {
  id: string;
  title: string;
  category: string;
  url: string;
  description: string;
}

export const AISearchButton = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  
  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    // Simulate AI-powered search
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, this would query a vector database or API
    const searchResults: SearchResult[] = [
      {
        id: 'res-1',
        title: 'How to manage inventory efficiently',
        category: 'knowledge-base',
        url: '/documentation#inventory',
        description: 'Learn best practices for pharmacy inventory management'
      },
      {
        id: 'res-2',
        title: 'Patient record privacy guidelines',
        category: 'legal',
        url: '/legal/privacy',
        description: 'Important information about handling patient data'
      },
      {
        id: 'res-3',
        title: 'Setting up automatic reordering',
        category: 'tutorial',
        url: '/documentation#reordering',
        description: 'Configure your inventory to automatically place orders when stock is low'
      }
    ].filter(item =>
      item.title.toLowerCase().startsWith(query.toLowerCase()) ||
      item.description.toLowerCase().startsWith(query.toLowerCase())
    );
    
    setResults(searchResults);
    setIsSearching(false);
  };
  
  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        variant="outline" 
        className="w-full mt-2 bg-primary/5 hover:bg-primary/10"
      >
        <Search className="h-4 w-4 mr-2" />
        <span>Smart Search</span>
        <Sparkles className="h-3 w-3 ml-2 text-amber-500" />
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              AI-Powered Search
            </DialogTitle>
            <DialogDescription>
              Ask any question in natural language and get accurate results.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <div className="flex space-x-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="How do I set up automatic reordering?"
                className="flex-1"
              />
              <Button type="submit" size="sm" onClick={handleSearch} disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            <div className="mt-4">
              {isSearching ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : results.length > 0 ? (
                <Command>
                  <CommandList>
                    <CommandGroup heading="Search Results">
                      {results.map((result) => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => {
                            window.location.href = result.url;
                            setOpen(false);
                          }}
                          className="cursor-pointer p-2"
                        >
                          <div>
                            <p className="font-medium">{result.title}</p>
                            <p className="text-sm text-muted-foreground">{result.description}</p>
                            <div className="flex items-center mt-1">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {result.category}
                              </span>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                  {results.length === 0 && query && !isSearching && (
                    <CommandEmpty>No results found for "{query}"</CommandEmpty>
                  )}
                </Command>
              ) : (
                query && !isSearching && (
                  <div className="text-center py-4 text-muted-foreground">
                    No results found for "{query}"
                  </div>
                )
              )}
            </div>
            
            <div className="text-xs text-muted-foreground mt-4">
              <p>
                This AI-powered search can understand natural language queries and find relevant information across the entire pharmacy system.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
