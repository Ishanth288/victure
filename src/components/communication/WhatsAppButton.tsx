
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { sanitizeInput } from '@/utils/securityUtils';
import { checkRateLimit } from '@/utils/securityUtils';
import { stableToast } from '@/components/ui/stable-toast';

interface WhatsAppButtonProps {
  phoneNumber: string;
  prefilledText?: string;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  showDialog?: boolean;
}

export function WhatsAppButton({ 
  phoneNumber = "9390621556", // Default to the number from prompt
  prefilledText = "Hello! I'm interested in Victure PharmEase.",
  buttonText = "Chat with us", 
  buttonVariant = "default",
  className = "",
  showDialog = true
}: WhatsAppButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState(prefilledText);
  const [isSending, setIsSending] = useState(false);

  const handleButtonClick = () => {
    if (showDialog) {
      setIsDialogOpen(true);
    } else {
      openWhatsApp();
    }
  };

  const openWhatsApp = () => {
    // Check rate limiting
    if (!checkRateLimit('whatsapp_contact', 3, 60000)) {
      stableToast({
        title: "Please wait",
        description: "You can only initiate a new chat once per minute",
        variant: "warning" 
      });
      return;
    }
    
    // Sanitize inputs
    const sanitizedMessage = sanitizeInput(message);
    const sanitizedName = name ? `${sanitizeInput(name)}: ` : '';
    
    // Construct WhatsApp URL
    const encodedText = encodeURIComponent(`${sanitizedName}${sanitizedMessage}`);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber.replace(/\D/g, '')}&text=${encodedText}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    
    setIsDialogOpen(false);
    setIsSending(false);
    
    // Show success toast
    stableToast({
      title: "WhatsApp opening",
      description: "You'll be redirected to continue the conversation",
      variant: "success"
    });
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      stableToast({
        title: "Message required",
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    
    // Simulate a brief delay before opening WhatsApp
    setTimeout(openWhatsApp, 500);
  };

  return (
    <>
      <Button 
        variant={buttonVariant as any} 
        onClick={handleButtonClick}
        className={`flex items-center gap-2 ${className}`}
      >
        <MessageCircle size={18} />
        {buttonText}
      </Button>
      
      {showDialog && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Contact via WhatsApp</DialogTitle>
              <DialogDescription>
                Send us a message on WhatsApp for quick assistance.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  placeholder="Your name (optional)"
                  className="col-span-3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="message" className="text-right text-sm font-medium">
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Type your message here"
                  className="col-span-3"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage} disabled={isSending}>
                {isSending ? "Opening WhatsApp..." : "Continue to WhatsApp"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
