
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RegistrationData } from "@/types/registration";
import { useState } from "react";
import { CheckCircle, X } from "lucide-react";

interface AccountFieldsProps {
  formData: RegistrationData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRoleChange: (value: string) => void;
}

export function AccountFields({ formData, onChange, onRoleChange }: AccountFieldsProps) {
  const [passwordStrength, setPasswordStrength] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasUppercase: false,
    isStrong: false
  });
  
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const isStrong = minLength && hasNumber && hasSpecialChar && hasUppercase;
    
    setPasswordStrength({
      minLength,
      hasNumber,
      hasSpecialChar,
      hasUppercase,
      isStrong
    });
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    validatePassword(e.target.value);
  };

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
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password* (minimum 8 characters)</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter password"
          value={formData.password}
          onChange={handlePasswordChange}
          required
          autoComplete="new-password"
          className={formData.password ? (passwordStrength.isStrong ? "border-green-500" : "border-red-500") : ""}
        />
        
        {formData.password && (
          <div className="mt-2 text-sm">
            <p className="font-medium mb-1">Password requirements:</p>
            <ul className="space-y-1">
              <li className="flex items-center">
                {passwordStrength.minLength ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <X className="h-4 w-4 text-red-500 mr-2" />
                )}
                <span className={passwordStrength.minLength ? "text-green-600" : "text-red-600"}>
                  At least 8 characters
                </span>
              </li>
              <li className="flex items-center">
                {passwordStrength.hasNumber ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <X className="h-4 w-4 text-red-500 mr-2" />
                )}
                <span className={passwordStrength.hasNumber ? "text-green-600" : "text-red-600"}>
                  Contains at least one number
                </span>
              </li>
              <li className="flex items-center">
                {passwordStrength.hasSpecialChar ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <X className="h-4 w-4 text-red-500 mr-2" />
                )}
                <span className={passwordStrength.hasSpecialChar ? "text-green-600" : "text-red-600"}>
                  Contains at least one special character
                </span>
              </li>
              <li className="flex items-center">
                {passwordStrength.hasUppercase ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <X className="h-4 w-4 text-red-500 mr-2" />
                )}
                <span className={passwordStrength.hasUppercase ? "text-green-600" : "text-red-600"}>
                  Contains at least one uppercase letter
                </span>
              </li>
            </ul>
          </div>
        )}
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
