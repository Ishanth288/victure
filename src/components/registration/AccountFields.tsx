
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RegistrationData } from "@/types/registration";

interface AccountFieldsProps {
  formData: RegistrationData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRoleChange: (value: string) => void;
}

export function AccountFields({ formData, onChange, onRoleChange }: AccountFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">Email Address*</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter email address"
          value={formData.email}
          onChange={onChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password*</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter password"
          value={formData.password}
          onChange={onChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">User Role*</Label>
        <Select onValueChange={onRoleChange} required>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pharmacist">Pharmacist</SelectItem>
            <SelectItem value="technician">Technician</SelectItem>
            <SelectItem value="administrator">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
