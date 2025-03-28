
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface LegalLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function LegalLayout({ children, title }: LegalLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container mx-auto px-4 py-16 mt-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-primary hover:underline">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>
        
        <div className="mb-8">
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
