
import { useState } from "react";
import { PatientDetailsModal } from "@/components/billing/PatientDetailsModal";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus } from "lucide-react";

export default function Billing() {
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [currentPrescriptionId, setCurrentPrescriptionId] = useState<number | null>(null);

  const handlePatientDetailsSuccess = (prescriptionId: number) => {
    setCurrentPrescriptionId(prescriptionId);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Billing</h1>
          {!currentPrescriptionId && (
            <Button onClick={() => setShowPatientModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Bill
            </Button>
          )}
        </div>

        <PatientDetailsModal
          open={showPatientModal}
          onOpenChange={setShowPatientModal}
          onSuccess={handlePatientDetailsSuccess}
        />

        {currentPrescriptionId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {/* Search and Add Items section will go here */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Add Items</h2>
                {/* Search bar and results will be implemented next */}
              </div>
            </div>

            <div>
              {/* Cart/Billing Summary section will go here */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Bill Summary</h2>
                {/* Cart items and totals will be implemented next */}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
