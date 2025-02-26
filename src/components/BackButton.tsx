
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show back button on index page
  if (location.pathname === '/') {
    return null;
  }

  const handleBack = () => {
    // If there's a previous page in history, go back
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // If no history, navigate to a default page based on context
      if (location.pathname.includes('/dashboard')) {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed top-4 left-4 z-50"
      onClick={handleBack}
    >
      <ChevronLeft className="h-6 w-6" />
    </Button>
  );
}
