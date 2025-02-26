
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDIAN_STATES } from "@/constants/states";
import { RegistrationData } from "@/types/registration";

interface AddressFieldsProps {
  formData: RegistrationData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStateChange: (value: string) => void;
}

export function AddressFields({ formData, onChange, onStateChange }: AddressFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="address">Address*</Label>
        <Input
          id="address"
          placeholder="Enter complete address"
          value={formData.address}
          onChange={onChange}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City*</Label>
          <Input
            id="city"
            placeholder="Enter city"
            value={formData.city}
            onChange={onChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State*</Label>
          <Select onValueChange={onStateChange} required>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pincode">PIN Code*</Label>
          <Input
            id="pincode"
            placeholder="Enter PIN code"
            value={formData.pincode}
            onChange={onChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gstin">GSTIN (Optional)</Label>
          <Input
            id="gstin"
            placeholder="Enter GSTIN"
            value={formData.gstin}
            onChange={onChange}
          />
        </div>
      </div>
    </>
  );
}
