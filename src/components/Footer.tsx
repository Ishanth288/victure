
import { HashLink } from 'react-router-hash-link';

export default function Footer() {
  return (
    <footer className="bg-neutral-50 py-12">
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
                <HashLink smooth to="#" className="text-neutral-600 hover:text-primary transition-colors">
                  Pricing
                </HashLink>
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
                <HashLink smooth to="#" className="text-neutral-600 hover:text-primary transition-colors">
                  Contact
                </HashLink>
              </li>
              <li>
                <HashLink smooth to="#" className="text-neutral-600 hover:text-primary transition-colors">
                  Careers
                </HashLink>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-neutral-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <HashLink smooth to="#" className="text-neutral-600 hover:text-primary transition-colors">
                  Privacy Policy
                </HashLink>
              </li>
              <li>
                <HashLink smooth to="#" className="text-neutral-600 hover:text-primary transition-colors">
                  Terms of Service
                </HashLink>
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
