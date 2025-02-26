
import { PatientCard } from "./PatientCard";
import { Patient } from "@/types/patients";

interface PatientListProps {
  patients: Patient[];
  onViewBill: (billId: number) => void;
}

export function PatientList({ patients, onViewBill }: PatientListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {patients.map((patient) => (
        <PatientCard
          key={patient.id}
          name={patient.name}
          phoneNumber={patient.phone_number}
          bills={patient.bills}
          totalSpent={patient.total_spent}
          onViewBill={onViewBill}
        />
      ))}
    </div>
  );
}
