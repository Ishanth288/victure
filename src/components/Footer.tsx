
import { HashLink } from 'react-router-hash-link';

export default function Footer() {
  const handlePricingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("Contact us at victurehealthcaresolutions@gmail.com");
  };

  const handleLegalClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open('https://www.termsfeed.com/live/661b4717-faf2-4a61-a219-ddc2010a943c', '_blank');
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("Contact us at victurehealthcaresolutions@gmail.com");
  };

  return (
    <footer className="bg-white py-12 border-t">
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
                <HashLink smooth to="#" className="text-neutral-600 hover:text-primary transition-colors">
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
                <a href="#" onClick={handleLegalClick} className="text-neutral-600 hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" onClick={handleLegalClick} className="text-neutral-600 hover:text-primary transition-colors">
                  Terms of Service
                </a>
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
