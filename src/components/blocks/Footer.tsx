
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';

export function Footer() {
  return (
    <footer id="footer" className="bg-white border-t pt-12 pb-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <h2 className="text-2xl font-bold text-primary">Victure</h2>
            </Link>
            <p className="text-muted-foreground mb-4">
              Modern pharmacy management system with AI-powered insights and optimization tools.
            </p>
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
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
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
            </ul>
          </div>
        </div>
        
        <div className="border-t pt-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 Victure. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
