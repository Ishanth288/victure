
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface WelcomeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WelcomeDialog({ isOpen, onOpenChange }: WelcomeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome to Your Dashboard</DialogTitle>
          <DialogDescription>
            Here you can view all your pharmacy metrics in one place. The dashboard shows key performance indicators, revenue trends, top-selling products, and more. Explore the various sections to get insights into your business performance.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
