
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsAppButton } from './communication/WhatsAppButton';
import LegalFooter from './LegalFooter';
import { AISearchButton } from './ai/AISearchButton';

const Footer = () => {
  return (
    <footer id="footer" className="bg-white border-t pt-12 pb-0 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <h2 className="text-2xl font-bold text-primary">Victure</h2>
            </Link>
            <p className="text-muted-foreground mb-4">
              Modern pharmacy management system with AI-powered insights and optimization tools.
            </p>
            <AISearchButton />
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <HashLink smooth to="/#features" className="text-muted-foreground hover:text-primary transition-colors">
                  Features
                </HashLink>
              </li>
              <li>
                <HashLink smooth to="/#benefits" className="text-muted-foreground hover:text-primary transition-colors">
                  Benefits
                </HashLink>
              </li>
              <li>
                <HashLink smooth to="/#pricing" className="text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </HashLink>
              </li>
              <li>
                <Link to="/documentation" className="text-muted-foreground hover:text-primary transition-colors">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <HashLink smooth to="/#scroll-animation" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </HashLink>
              </li>
              <li>
                <HashLink smooth to="/#feedback" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </HashLink>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/legal/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/legal/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/legal/refund-policy" className="text-muted-foreground hover:text-primary transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/legal/sla" className="text-muted-foreground hover:text-primary transition-colors">
                  Service Level Agreement
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t pt-8 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-muted-foreground">
              <h3 className="font-semibold mb-1">Ready to transform your pharmacy?</h3>
              <p className="text-sm">Experience the power of AI-driven pharmacy management.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <WhatsAppButton 
                phoneNumber="9390621556"
                buttonText="Chat with Sales"
                variant="outline"
              />
              
              <Button className="flex items-center gap-2">
                Get Started
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <LegalFooter />
    </footer>
  );
};

export default Footer;
