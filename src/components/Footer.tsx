
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsAppButton } from './communication/WhatsAppButton';
import LegalFooter from './LegalFooter';

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
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="h-5 w-5 text-gray-400 hover:text-primary transition-colors" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <Twitter className="h-5 w-5 text-gray-400 hover:text-primary transition-colors" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="h-5 w-5 text-gray-400 hover:text-primary transition-colors" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5 text-gray-400 hover:text-primary transition-colors" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <Youtube className="h-5 w-5 text-gray-400 hover:text-primary transition-colors" />
              </a>
            </div>
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
                <Link to="/careers" className="text-muted-foreground hover:text-primary transition-colors">
                  Careers
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
                <Link to="/legal/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/legal/acceptable-use" className="text-muted-foreground hover:text-primary transition-colors">
                  Acceptable Use
                </Link>
              </li>
              <li>
                <Link to="/legal/sla" className="text-muted-foreground hover:text-primary transition-colors">
                  SLA
                </Link>
              </li>
              <li>
                <Link to="/legal/refund" className="text-muted-foreground hover:text-primary transition-colors">
                  Refund Policy
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
