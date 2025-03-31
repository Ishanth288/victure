
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
        <Label htmlFor="pharmacy_name">Pharmacy Name*</Label>
        <Input
          id="pharmacy_name"
          name="pharmacy_name"
          placeholder="Enter pharmacy name"
          value={formData.pharmacy_name || formData.pharmacyName}
          onChange={onChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="owner_name">Owner Name*</Label>
        <Input
          id="owner_name"
          name="owner_name"
          placeholder="Enter owner name"
          value={formData.owner_name || formData.ownerName}
          onChange={onChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number*</Label>
        <Input
          id="phone"
          name="phone"
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
