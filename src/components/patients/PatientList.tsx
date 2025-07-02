
import { PatientCard } from "./PatientCard";
import { Patient } from "@/types/patients";

interface PatientListProps {
  patients: Patient[];
  onViewBill: (billId: number, patient: any, prescription: any) => void;
  onToggleStatus: (patientId: number, currentStatus: string) => void;
  onCreateBill?: (prescriptionId: number) => void;
  onToggleFlag: (patientId: number, currentFlagStatus: boolean) => void;
}

export function PatientList({ 
  patients, 
  onViewBill, 
  onToggleStatus, 
  onCreateBill,
  onToggleFlag
}: PatientListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {patients.map((patient) => (
        <PatientCard
          key={patient.id}
          id={patient.id}
          name={patient.name}
          phoneNumber={patient.phone_number}
          bills={patient.bills}
          prescriptions={patient.prescriptions}
          totalSpent={patient.total_spent}
          status={patient.status}
          isFlagged={patient.is_flagged}
          onViewBill={onViewBill}
          onToggleStatus={onToggleStatus}
          onCreateBill={onCreateBill}
          onToggleFlag={onToggleFlag}
        />
      ))}
    </div>
  );
}
