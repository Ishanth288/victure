
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface CartHeaderProps {
  patientName?: string;
  phoneNumber?: string;
}

export function CartHeader({ patientName, phoneNumber }: CartHeaderProps) {
  const navigate = useNavigate();

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/billing")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold text-primary">Generate Bill</CardTitle>
          </div>
          {patientName && phoneNumber && (
            <div className="text-sm text-gray-500">
              Patient: {patientName} | Phone: {phoneNumber}
            </div>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
