
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-neutral-50 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="text-2xl font-bold text-primary">
              Victure
            </Link>
            <p className="mt-4 text-neutral-600">
              Streamlining pharmacy operations for better patient care.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-neutral-900 mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#features" className="text-neutral-600 hover:text-primary transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="#benefits" className="text-neutral-600 hover:text-primary transition-colors">
                  Benefits
                </Link>
              </li>
              <li>
                <Link to="#" className="text-neutral-600 hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-neutral-900 mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-neutral-600 hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="#" className="text-neutral-600 hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="#" className="text-neutral-600 hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-neutral-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-neutral-600 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="#" className="text-neutral-600 hover:text-primary transition-colors">
                  Terms of Service
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
