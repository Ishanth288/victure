
import { Button } from "@/components/ui/button";
import { HashLink } from 'react-router-hash-link';

export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <HashLink to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">Victure</span>
          </HashLink>

          <div className="hidden md:flex items-center space-x-8">
            <HashLink smooth to="#features" className="text-neutral-600 hover:text-primary transition-colors">
              Features
            </HashLink>
            <HashLink smooth to="#benefits" className="text-neutral-600 hover:text-primary transition-colors">
              Benefits
            </HashLink>
            <HashLink smooth to="#testimonials" className="text-neutral-600 hover:text-primary transition-colors">
              Testimonials
            </HashLink>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-neutral-600 hover:text-primary">
              Login
            </Button>
            <Button className="bg-primary hover:bg-primary-dark text-white">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
