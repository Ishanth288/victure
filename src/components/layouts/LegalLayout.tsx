
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Footer from "@/components/Footer";
import { useEffect, useRef } from "react";

interface LegalLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function LegalLayout({ children, title }: LegalLayoutProps) {
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const fromRegistration = location.state?.fromRegistration || false;
  
  useEffect(() => {
    // Scroll to content when the component mounts
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6 mt-4">
          {fromRegistration ? (
            <Link 
              to="/auth" 
              state={{ isLogin: false, fromLegal: true }} 
              className="inline-flex items-center text-primary hover:underline"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Registration
            </Link>
          ) : (
            <Link to="/" className="inline-flex items-center text-primary hover:underline">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
          )}
        </div>
        
        <div className="mb-8" ref={contentRef}>
          <h1 className="text-green-500 text-2xl font-bold">Victure Healthcare Solutions</h1>
          <h2 className="text-3xl font-bold mt-2">{title}</h2>
          <div className="w-20 h-1 bg-green-500 mt-2"></div>
        </div>
        
        <div className="prose prose-neutral max-w-none">
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
