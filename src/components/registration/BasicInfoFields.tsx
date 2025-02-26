
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegistrationData } from "@/types/registration";

interface BasicInfoFieldsProps {
  formData: RegistrationData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BasicInfoFields({ formData, onChange }: BasicInfoFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="pharmacyName">Pharmacy Name*</Label>
        <Input
          id="pharmacyName"
          placeholder="Enter pharmacy name"
          value={formData.pharmacyName}
          onChange={onChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ownerName">Owner Name*</Label>
        <Input
          id="ownerName"
          placeholder="Enter owner name"
          value={formData.ownerName}
          onChange={onChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number*</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="Enter phone number"
          value={formData.phone}
          onChange={onChange}
          required
        />
      </div>
    </>
  );
}
