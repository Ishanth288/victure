import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react"; // Icon for the button
import { stableToast } from "@/components/ui/stable-toast"; // Using the stable toast

// Define the secret code (as requested)
const ADMIN_SECRET_CODE = "6551260939";
// Define the target route for the admin portal
const ADMIN_PORTAL_ROUTE = "/admin"; // Adjust if your admin route is different

export function AdminAccessButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleOpenPortal = useCallback(() => {
    setError(''); // Clear previous errors
    if (inputCode === ADMIN_SECRET_CODE) {
      // Correct code entered
      stableToast({
        title: "Access Granted",
        description: "Redirecting to Admin Portal...",
        variant: "default", // Or "success" if you have one
      });
      setIsOpen(false); // Close the dialog
      setInputCode(''); // Clear the input
      navigate(ADMIN_PORTAL_ROUTE); // Navigate to the admin portal
    } else {
      // Incorrect code
      setError("Invalid secret code. Please try again.");
      setInputCode(''); // Clear the input
      stableToast({
        title: "Access Denied",
        description: "The secret code entered was incorrect.",
        variant: "destructive",
      });
    }
  }, [inputCode, navigate]);

  // Handle Enter key press in the input field
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleOpenPortal();
    }
  };

  // Reset state when dialog is closed
  const handleOpenChange = (open: boolean) => {
     setIsOpen(open);
     if (!open) {
        setInputCode('');
        setError('');
     }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {/* This is the button that will appear in your sidebar */}
        {/* Adjust variant/styling as needed to match other sidebar buttons */}
        <Button variant="ghost" className="w-full justify-start text-sm font-normal"> {/* Adjusted style slightly */}
          <ShieldCheck className="mr-2 h-4 w-4" />
          Admin Portal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Admin Access</DialogTitle>
          <DialogDescription>
            Enter the secret code to access the admin portal. This action may be logged.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="secret-code" className="text-right">
              Secret Code
            </Label>
            <Input
              id="secret-code"
              type="password" // Use password type to mask input
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              onKeyPress={handleKeyPress} // Handle Enter key
              className="col-span-3"
              aria-describedby="code-error" // For accessibility
            />
          </div>
          {error && (
            <p id="code-error" className="text-sm text-red-600 text-center col-span-4">{error}</p>
          )}
        </div>
        <DialogFooter>
          {/* Using DialogClose to handle closing the dialog */}
          <DialogClose asChild>
             <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleOpenPortal}>Open Portal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}