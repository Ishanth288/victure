import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, User, ArrowRight, Search, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  featured: boolean;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Digital India in Pharmacy: How AI is Transforming Indian Healthcare",
    excerpt: "Explore how artificial intelligence is revolutionizing pharmacy operations across India, from inventory management to patient care, supporting the Digital India initiative.",
    content: "Artificial Intelligence is reshaping the Indian pharmaceutical industry in unprecedented ways. From predictive analytics for inventory management to personalized patient care recommendations, AI-powered pharmacy management systems are becoming essential tools for modern Indian healthcare providers.",
    author: "Dr. Priya Sharma",
    date: "2024-01-15",
    readTime: "5 min read",
    category: "Technology",
    tags: ["AI", "Digital India", "Pharmacy Management", "Healthcare Technology", "Innovation"],
    featured: true
  },
  {
    id: "2",
    title: "Essential Features for Indian Pharmacy Management: Compliance with DPCO and GST",
    excerpt: "Learn about the must-have features that help Indian pharmacies comply with DPCO regulations, GST requirements, and streamline operations efficiently.",
    content: "Indian pharmacy management requires sophisticated tools to handle complex regulatory requirements. From DPCO compliance tracking to GST-ready billing systems, discover the essential features that can transform your Indian pharmacy workflow.",
    author: "Rajesh Kumar",
    date: "2024-01-10",
    readTime: "7 min read",
    category: "Best Practices",
    tags: ["DPCO Compliance", "GST", "Indian Pharmacy", "Regulatory Requirements", "Efficiency"],
    featured: true
  },
  {
    id: "3",
    title: "Inventory Management for Indian Pharmacies: Monsoon Storage and Expiry Control",
    excerpt: "Smart inventory strategies for Indian pharmacies to handle monsoon challenges, reduce expired medications, and optimize stock levels in the Indian climate.",
    content: "Effective inventory management is crucial for Indian pharmacy profitability, especially during monsoon seasons. Learn how to implement climate-aware storage systems, track expiration dates, and use data analytics to optimize your stock levels while minimizing waste in Indian conditions.",
    author: "Anita Patel",
    date: "2024-01-05",
    readTime: "6 min read",
    category: "Business Strategy",
    tags: ["Monsoon Storage", "Indian Climate", "Inventory Optimization", "Cost Reduction", "Analytics"],
    featured: false
  },
  {
    id: "4",
    title: "Patient Safety in Rural India: Technology Solutions for Remote Healthcare",
    excerpt: "Discover how digital tools are improving patient safety in rural Indian pharmacies through better medication tracking, Ayurveda integration, and prescription accuracy.",
    content: "Patient safety is paramount in Indian pharmacy operations, especially in rural areas. Modern technology offers unprecedented opportunities to enhance medication safety through automated verification systems, Ayurveda-allopathy interaction checking, and comprehensive patient history tracking across India's diverse healthcare landscape.",
    author: "Dr. Vikram Singh",
    date: "2023-12-28",
    readTime: "8 min read",
    category: "Patient Care",
    tags: ["Rural Healthcare", "Patient Safety", "Ayurveda Integration", "Digital Health", "Quality Assurance"],
    featured: false
  },
  {
    id: "5",
    title: "Navigating Indian Pharmacy Regulations: CDSCO, State Licensing, and Digital Compliance",
    excerpt: "Understanding how modern pharmacy management systems help Indian pharmacies comply with CDSCO guidelines, state licensing requirements, and digital documentation.",
    content: "Staying compliant with Indian healthcare regulations can be challenging. Learn how technology solutions can automate CDSCO compliance tracking, manage state licensing requirements, and ensure your Indian pharmacy meets all regulatory standards including digital documentation mandates.",
    author: "Meera Gupta",
    date: "2023-12-20",
    readTime: "6 min read",
    category: "Compliance",
    tags: ["CDSCO Compliance", "State Licensing", "Indian Regulations", "Digital Documentation", "Automation"],
    featured: false
  },
  {
    id: "6",
    title: "ROI for Indian Pharmacies: Cost-Effective Technology Solutions for Small Businesses",
    excerpt: "A comprehensive guide for Indian pharmacy owners to understand the financial benefits of implementing affordable pharmacy management software.",
    content: "Investing in pharmacy management software requires careful consideration for Indian small business owners. This guide helps you calculate the potential ROI through improved efficiency, reduced errors, and enhanced customer satisfaction while considering the Indian market dynamics.",
    author: "Suresh Agarwal",
    date: "2023-12-15",
    readTime: "9 min read",
    category: "Business Strategy",
    tags: ["ROI", "Indian Small Business", "Cost-Effective Solutions", "Market Analysis", "Business Growth"],
    featured: false
  }
];

const categories = ["All", "Technology", "Best Practices", "Business Strategy", "Patient Care", "Compliance"];

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Indian Pharmacy Management Blog - Digital India Healthcare Insights | Victure"
        description="Stay updated with the latest trends in Indian pharmacy management, Digital India healthcare initiatives, DPCO compliance, GST integration, and Ayurveda technology. Expert insights for Indian pharmacies."
        keywords="indian pharmacy management blog, digital india healthcare, AI in indian pharmacy, DPCO compliance, GST pharmacy software, indian healthcare insights, ayurveda integration, pharmaceutical management india, healthcare automation india, digital pharmacy india, pharmacy analytics india, medication management india, CDSCO compliance, indian pharmacy operations, monsoon storage pharmacy, rural healthcare india"
        canonicalUrl="/blog"
        ogType="website"
        author="Victure Team"
      />
      
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Indian Pharmacy Management Insights
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Stay ahead with expert insights on Indian pharmacy technology, DPCO compliance, Digital India initiatives, and industry trends
              </p>
              
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md bg-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">Featured Articles</h2>
              <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {featuredPosts.map(post => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{post.category}</Badge>
                        <Badge variant="outline">Featured</Badge>
                      </div>
                      <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                      <CardDescription className="text-base">{post.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {post.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(post.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {post.readTime}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="outline" className="w-full">
                        Read More
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Posts */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Latest Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {filteredPosts.map(post => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{post.category}</Badge>
                      {post.featured && <Badge variant="outline">Featured</Badge>}
                    </div>
                    <CardTitle className="text-lg mb-2">{post.title}</CardTitle>
                    <CardDescription>{post.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.readTime}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Read Article
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No articles found matching your criteria.</p>
                <Button 
                  variant="outline" 
                  onClick={() => { setSearchTerm(""); setSelectedCategory("All"); }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Stay Updated with Indian Pharmacy Trends</h2>
              <p className="text-gray-600 mb-8">
                Get the latest Indian pharmacy management insights, DPCO updates, Digital India healthcare news, and expert tips delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-1"
                />
                <Button>
                  Subscribe
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                No spam, unsubscribe at any time.
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Blog;