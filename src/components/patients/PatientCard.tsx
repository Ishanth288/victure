
import { format } from "date-fns";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientBill } from "@/types/patients";

interface PatientCardProps {
  name: string;
  phoneNumber: string;
  bills: PatientBill[];
  totalSpent: number;
  onViewBill: (billId: number) => void;
}

export function PatientCard({
  name,
  phoneNumber,
  bills,
  totalSpent,
  onViewBill,
}: PatientCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Phone Number</p>
            <p>{phoneNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Bills</p>
            <p>{bills.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p>₹{totalSpent.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Recent Bills</p>
            {bills.slice(0, 3).map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div>
                  <p className="text-sm font-medium">
                    {format(new Date(bill.date), "dd/MM/yyyy")}
                  </p>
                  <p className="text-sm text-gray-500">
                    ₹{bill.total_amount.toFixed(2)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewBill(bill.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
