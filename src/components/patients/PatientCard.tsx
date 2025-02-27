
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, XCircle, CheckCircle } from "lucide-react";
import { PatientBill } from "@/types/patients";

interface PatientCardProps {
  id: number;
  name: string;
  phoneNumber: string;
  bills: PatientBill[];
  totalSpent: number;
  status?: string;
  onViewBill: (billId: number) => void;
  onToggleStatus: (patientId: number, currentStatus: string) => void;
}

export function PatientCard({
  id,
  name,
  phoneNumber,
  bills,
  totalSpent,
  status = 'active',
  onViewBill,
  onToggleStatus,
}: PatientCardProps) {
  const isInactive = status === 'inactive';

  return (
    <Card className={`overflow-hidden ${isInactive ? 'bg-gray-50' : ''}`}>
      <CardContent className="p-6">
        <div className="flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  !isInactive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {status}
                </span>
              </div>
              <p className="text-sm text-gray-500">{phoneNumber}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onToggleStatus(id, status)}
            >
              {!isInactive ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark Inactive
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Active
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Total Spent</span>
            <span className="font-medium">₹{totalSpent.toFixed(2)}</span>
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-medium mb-2">Recent Bills</h4>
            <div className="space-y-2">
              {bills.length === 0 ? (
                <p className="text-sm text-gray-500">No bills found</p>
              ) : (
                bills.slice(0, 3).map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                  >
                    <div>
                      <p className="font-medium">{bill.bill_number}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(bill.date), "MMM dd, yyyy")}
                      </p>
                      <p className="text-xs text-gray-500">
                        Dr. {bill.prescription.doctor_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">₹{bill.total_amount.toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewBill(bill.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
              {bills.length > 3 && (
                <p className="text-xs text-center text-gray-500 mt-2">
                  + {bills.length - 3} more bills
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
