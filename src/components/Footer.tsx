
import { HashLink } from 'react-router-hash-link';
import { Link } from 'react-router-dom';

export default function Footer() {
  const handlePricingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Open Gmail compose for pricing inquiries
    const subject = "Pricing Inquiry";
    const body = "Hello,\n\nI would like to inquire about your pricing plans.\n\nThank you.";
    
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=victurehealthcaresolutions@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Open Gmail compose for general contact
    const subject = "General Inquiry";
    const body = "Hello,\n\nI would like to get in touch regarding the following:\n\n[Your message here]\n\nThank you,\n[Your Name]";
    
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=victurehealthcaresolutions@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <footer id="footer" className="bg-white py-12 border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <HashLink to="/" className="text-2xl font-bold text-primary">
              Victure
            </HashLink>
            <p className="mt-4 text-neutral-600">
              Streamlining pharmacy operations for better patient care.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-neutral-900 mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <HashLink smooth to="#features" className="text-neutral-600 hover:text-primary transition-colors">
                  Features
                </HashLink>
              </li>
              <li>
                <HashLink smooth to="#benefits" className="text-neutral-600 hover:text-primary transition-colors">
                  Benefits
                </HashLink>
              </li>
              <li>
                <a href="#" onClick={handlePricingClick} className="text-neutral-600 hover:text-primary transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-neutral-900 mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <HashLink smooth to="#scroll-animation" className="text-neutral-600 hover:text-primary transition-colors">
                  About Us
                </HashLink>
              </li>
              <li>
                <a href="#" onClick={handleContactClick} className="text-neutral-600 hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-neutral-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/legal/privacy-policy" className="text-neutral-600 hover:text-green-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/legal/terms-of-service" className="text-neutral-600 hover:text-green-500 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/legal/eula" className="text-neutral-600 hover:text-green-500 transition-colors">
                  EULA
                </Link>
              </li>
              <li>
                <Link to="/legal/sla" className="text-neutral-600 hover:text-green-500 transition-colors">
                  SLA
                </Link>
              </li>
              <li>
                <Link to="/legal/refund-policy" className="text-neutral-600 hover:text-green-500 transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/legal/acceptable-use-policy" className="text-neutral-600 hover:text-green-500 transition-colors">
                  Acceptable Use Policy
                </Link>
              </li>
              <li>
                <Link to="/legal/disclaimers" className="text-neutral-600 hover:text-green-500 transition-colors">
                  Disclaimers
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-200 mt-12 pt-8 text-center text-neutral-600">
          <p>&copy; {new Date().getFullYear()} Victure. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
