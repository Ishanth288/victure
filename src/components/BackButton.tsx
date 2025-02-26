
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed top-4 left-4 z-50"
      onClick={() => navigate(-1)}
    >
      <ChevronLeft className="h-6 w-6" />
    </Button>
  );
}
