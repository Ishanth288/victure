
import { PatientCard } from "./PatientCard";
import { Patient } from "@/types/patients";

interface PatientListProps {
  patients: Patient[];
  onViewBill: (billId: number) => void;
  onToggleStatus: (patientId: number, currentStatus: string) => void;
  onCreateBill?: (prescriptionId: number) => void;
  onDeletePatient: (patientId: number) => void;
}

export function PatientList({ 
  patients, 
  onViewBill, 
  onToggleStatus, 
  onCreateBill,
  onDeletePatient
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
          onViewBill={onViewBill}
          onToggleStatus={onToggleStatus}
          onCreateBill={onCreateBill}
          onDeletePatient={onDeletePatient}
        />
      ))}
    </div>
  );
}
