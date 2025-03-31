
import { useState, useEffect } from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SearchableKnowledgeBase } from "@/components/documentation/SearchableKnowledgeBase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, FileText, Code, PenTool, Lightbulb, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/communication/WhatsAppButton";

export default function Documentation() {
  const [activeTab, setActiveTab] = useState("guides");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading delay to demonstrate a smoother experience
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Victure Documentation</h1>
            <p className="text-xl text-gray-600">
              Everything you need to know about setting up and using Victure PharmEase
            </p>
          </div>
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
            <div className="flex justify-center mb-8">
              <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2">
                <TabsTrigger value="guides" className="flex flex-col items-center gap-1 py-3">
                  <Book className="h-4 w-4" />
                  <span>Guides</span>
                </TabsTrigger>
                <TabsTrigger value="api" className="flex flex-col items-center gap-1 py-3">
                  <Code className="h-4 w-4" />
                  <span>API Docs</span>
                </TabsTrigger>
                <TabsTrigger value="tutorials" className="flex flex-col items-center gap-1 py-3">
                  <PenTool className="h-4 w-4" />
                  <span>Tutorials</span>
                </TabsTrigger>
                <TabsTrigger value="releases" className="flex flex-col items-center gap-1 py-3">
                  <FileText className="h-4 w-4" />
                  <span>Releases</span>
                </TabsTrigger>
                <TabsTrigger value="tips" className="flex flex-col items-center gap-1 py-3">
                  <Lightbulb className="h-4 w-4" />
                  <span>Tips</span>
                </TabsTrigger>
                <TabsTrigger value="config" className="flex flex-col items-center gap-1 py-3">
                  <Settings className="h-4 w-4" />
                  <span>Configuration</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg p-6">
              <TabsContent value="guides" className="mt-0">
                <SearchableKnowledgeBase />
              </TabsContent>
              
              <TabsContent value="api" className="mt-0">
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-4">API Documentation</h2>
                  <p className="text-gray-600 mb-8">Our comprehensive API documentation is coming soon.</p>
                  <Button>Request Early Access</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="tutorials" className="mt-0">
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-4">Video Tutorials</h2>
                  <p className="text-gray-600 mb-8">Step-by-step video tutorials are being prepared.</p>
                  <Button>Subscribe for Updates</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="releases" className="mt-0">
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-4">Release Notes</h2>
                  <p className="text-gray-600 mb-8">Detailed information about each release version.</p>
                  <Button>View Latest Release</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="tips" className="mt-0">
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-4">Tips & Tricks</h2>
                  <p className="text-gray-600 mb-8">Discover advanced features and productivity shortcuts.</p>
                  <Button>Browse Tips</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="config" className="mt-0">
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-4">Configuration Guide</h2>
                  <p className="text-gray-600 mb-8">Learn how to customize Victure PharmEase for your needs.</p>
                  <Button>View Configuration Options</Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
          
          <div className="max-w-3xl mx-auto mt-16 bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? Our support team is ready to assist you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <WhatsAppButton 
                phoneNumber="+917123456789"
                buttonText="Chat with Support"
                className="w-full sm:w-auto"
              />
              <Button variant="outline" className="w-full sm:w-auto">
                Email Support
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
