import React, { useState, useCallback } from 'react'; // <-- Added useState, useCallback
import { useNavigate } from 'react-router-dom'; // <-- Added useNavigate
import { SidebarLinks } from "@/components/dashboard/SidebarLinks";
import { cn } from "@/lib/utils";
import { useProfileData } from "@/components/dashboard/ProfileSection"; // Assuming this hook exists
import { ChevronLeft, ShieldCheck } from "lucide-react"; // <-- Added ShieldCheck
import { Button } from "@/components/ui/button"; // <-- Added Button
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"; // <-- Added Dialog components
import { Input } from "@/components/ui/input"; // <-- Added Input
import { Label } from "@/components/ui/label"; // <-- Added Label
import { Separator } from "@/components/ui/separator";
import { stableToast } from "@/components/ui/stable-toast"; // <-- Added stableToast

// --- Admin Access Logic Integrated ---
const ADMIN_SECRET_CODE = "6551260939";
const ADMIN_PORTAL_ROUTE = "/admin"; // Adjust if your admin route is different
// --- End Admin Access Logic ---

export function SidebarContainer() {
  const { profileData } = useProfileData();
  const navigate = useNavigate();

  // --- State and Callbacks for Admin Access Dialog ---
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleOpenPortal = useCallback(() => {
    setAdminError(''); // Clear previous errors
    if (inputCode === ADMIN_SECRET_CODE) {
      // Correct code
      stableToast({
        title: "Access Granted",
        description: "Redirecting to Admin Portal...",
        variant: "default",
      });
      setIsAdminDialogOpen(false);
      setInputCode('');
      navigate(ADMIN_PORTAL_ROUTE);
    } else {
      // Incorrect code
      setAdminError("Invalid secret code. Please try again.");
      setInputCode('');
      stableToast({
        title: "Access Denied",
        description: "The secret code entered was incorrect.",
        variant: "destructive",
      });
    }
  }, [inputCode, navigate]);

  const handleAdminKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleOpenPortal();
    }
  };

  const handleAdminOpenChange = (open: boolean) => {
     setIsAdminDialogOpen(open);
     if (!open) {
        setInputCode('');
        setAdminError('');
     }
  }
  // --- End State and Callbacks ---

  const pharmacyName = profileData?.pharmacy_name || 'Victure';

  return (
    <div className={cn(
        "w-60 h-screen bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800",
        "flex flex-col flex-shrink-0"
      )}>
      {/* Header Section */}
      <div className="p-3 border-b dark:border-gray-800">
        <div className="flex items-center space-x-2 pl-1">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate" title={pharmacyName}>
            {pharmacyName}
          </h2>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto py-3">
         {/* === Admin Access Button and Dialog === */}
         <div className="px-3 mb-2">
            <Dialog open={isAdminDialogOpen} onOpenChange={handleAdminOpenChange}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-sm font-normal">
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
                      type="password"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      onKeyPress={handleAdminKeyPress}
                      className="col-span-3"
                      aria-describedby="code-error"
                    />
                  </div>
                  {adminError && (
                    <p id="code-error" className="text-sm text-red-600 text-center col-span-4">{adminError}</p>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                     <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="button" onClick={handleOpenPortal}>Open Portal</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Separator className="my-3" /> {/* Visual separator */}
         </div>
         {/* ==================================== */}

         {/* Render the main navigation links */}
         <SidebarLinks />
      </div>
    </div>
  );
}
