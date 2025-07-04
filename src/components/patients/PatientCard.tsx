import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, PlusCircle, History, Trash2 } from "lucide-react";
import { PatientBill } from "@/types/patients";
import { getReturnHistoryByBill } from "@/utils/returnUtils";
import { supabase } from "@/integrations/supabase/client";
import { logPatientDeletion } from "@/utils/deletionTracker";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PatientCardProps {
  id: number;
  name: string;
  phoneNumber: string;
  bills: PatientBill[];
  prescriptions?: any[];
  totalSpent: number;
  status?: string;
  onViewBill: (billId: number, patient: any, prescription: any) => void;
  onCreateBill?: (prescriptionId: number) => void;
  onPatientDeleted?: () => void;
}

export function PatientCard({
  id,
  name,
  phoneNumber,
  bills,
  prescriptions = [],
  totalSpent,
  status = 'active',
  onViewBill,
  onCreateBill,
  onPatientDeleted,
}: PatientCardProps) {
  const isInactive = status === 'inactive';
  const { toast } = useToast();

  const [showHistory, setShowHistory] = useState(false);
  const [returnHistory, setReturnHistory] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Check if patient has zero bill amount
  const hasZeroBillAmount = totalSpent === 0;

  useEffect(() => {
    if (showHistory && bills.length > 0) {
      const fetchReturnHistory = async () => {
        try {
          const billIds = bills.map(bill => bill.id);
          const history = await getReturnHistoryByBill(billIds);
          setReturnHistory(history);
        } catch (error) {
          console.error('Error fetching return history:', error);
        }
      };
      fetchReturnHistory();
    }
  }, [showHistory, bills]);

  const handleDeletePatient = async () => {
    if (!hasZeroBillAmount) {
      toast({
        title: "Cannot Delete Patient",
        description: "Only patients with zero bill amount can be deleted.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Log the deletion before actually deleting
      await logPatientDeletion(
        { id, name, phone_number: phoneNumber, created_at: new Date().toISOString() },
        "Patient deleted due to zero bill amount"
      );

      // Delete prescriptions first (if any)
      if (prescriptions && prescriptions.length > 0) {
        const { error: prescriptionError } = await supabase
          .from("prescriptions")
          .delete()
          .eq("patient_id", id);

        if (prescriptionError) {
          throw prescriptionError;
        }
      }

      // Delete the patient
      const { error: patientError } = await supabase
        .from("patients")
        .delete()
        .eq("id", id);

      if (patientError) {
        throw patientError;
      }

      toast({
        title: "Patient Deleted",
        description: `${name} has been successfully deleted.`,
      });

      // Notify parent component to refresh the list
      if (onPatientDeleted) {
        onPatientDeleted();
      }
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast({
        title: "Error",
        description: "Failed to delete patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

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
            
            {/* Delete button for patients with zero bill amount */}
            {hasZeroBillAmount && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Patient</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {name}? This patient has zero bill amount.
                      This action cannot be undone and will remove all associated prescriptions.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeletePatient}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete Patient"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Total Spent</span>
            <span className={`font-medium ${
              hasZeroBillAmount ? 'text-red-600' : ''
            }`}>
              ₹{totalSpent.toFixed(2)}
              {hasZeroBillAmount && (
                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                  Zero Amount
                </span>
              )}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Patient History</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="h-4 w-4 mr-1" />
                {showHistory ? 'Hide History' : 'Show History'}
              </Button>
            </div>

            {showHistory && (
              <div className="mt-2 rounded-3xl shadow-lg border border-gray-200 bg-white/80 backdrop-blur-lg p-4 max-h-80 overflow-y-auto flex flex-col gap-4 animate-fade-in">
                {prescriptions && prescriptions.length > 0 ? (
                  prescriptions.map((prescription: any) => (
                    <div key={prescription.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Rx #{prescription.prescription_number}</p>
                          <p className="text-xs text-gray-500">Dr. {prescription.doctor_name}</p>
                          <p className="text-xs text-gray-500">{format(new Date(prescription.date), "MMM dd, yyyy")}</p>
                        </div>
                        {prescription.status === 'active' && prescription.bills?.length === 0 && onCreateBill && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onCreateBill(prescription.id)}
                          >
                            <PlusCircle className="h-4 w-4 mr-1" />
                            Create Bill
                          </Button>
                        )}
                      </div>
                      {prescription.bills && prescription.bills.length > 0 ? (
                        prescription.bills
                          .filter((bill: any) => 
                            bill && 
                            bill.total_amount != null && 
                            !isNaN(bill.total_amount) && 
                            bill.total_amount > 0
                          )
                          .map((bill: any) => {
                          const hasReturns = bill.return_value > 0;
                          const originalAmount = bill.original_amount || bill.total_amount || 0;
                          const effectiveAmount = bill.effective_amount || bill.total_amount || 0;
                          const returnValue = bill.return_value || 0;
                          
                        return (
                          <div
                            key={bill.id}
                            className="ml-4 p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex justify-between items-center shadow-sm"
                          >
                            <div>
                              <p className="font-semibold text-blue-900">Bill #{bill.bill_number}</p>
                              <p className="text-xs text-gray-500">{format(new Date(bill.date), "MMM dd, yyyy")}</p>
                                <div className="text-xs text-gray-700">
                                  {hasReturns ? (
                                    <div className="space-y-1">
                                      <div className="line-through text-gray-400">
                                        Original: ₹{originalAmount.toFixed(2)}
                                      </div>
                                      <div className="font-medium text-green-700">
                                        Effective: ₹{effectiveAmount.toFixed(2)}
                                      </div>
                                      <div className="text-orange-600">
                                        (₹{returnValue.toFixed(2)} returned)
                                      </div>
                                    </div>
                                  ) : (
                                    <span>Amount: ₹{effectiveAmount.toFixed(2)}</span>
                                  )}
                                </div>
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="rounded-full shadow-md hover:bg-blue-200"
                              onClick={() => onViewBill(bill.id, { id, name, phoneNumber }, prescription)}
                            >
                              <Eye className="h-4 w-4 mr-1 text-blue-700" />
                              Preview
                            </Button>
                          </div>
                        );
                        })
                      ) : (
                        <div className="text-center text-gray-400 py-2">No bills found for this prescription.</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400">No history found.</div>
                )}
              </div>
            )}

            {!showHistory && (
              <div className="text-sm text-gray-500 text-center">
                Click 'Show History' to view all prescriptions and bills
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
