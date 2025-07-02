
import { PatientCard } from "./PatientCard";
import { Patient } from "@/types/patients";

interface PatientListProps {
  patients: Patient[];
  onViewBill: (billId: number, patient: any, prescription: any) => void;
  onCreateBill?: (prescriptionId: number) => void;
}

export function PatientList({ 
  patients, 
  onViewBill, 
  onCreateBill
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
          onCreateBill={onCreateBill}
        />
      ))}
    </div>
  );
}
