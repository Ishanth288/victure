
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  children?: React.ReactNode;
}

export function WhatsAppButton({
  phoneNumber = '9390621556',  // Default phone number
  message = 'Hello! I have a question about Victure PharmEase.',
  size = 'default',
  variant = 'default',
  className = '',
  children
}: WhatsAppButtonProps) {
  // Format phone number properly for WhatsApp API
  const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
  
  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Generate WhatsApp API URL
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
  
  // Handle click to open WhatsApp
  const handleClick = (e: React.MouseEvent) => {
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    e.preventDefault(); // Prevent default if used within a form
  };
  
  return (
    <Button
      onClick={handleClick}
      size={size}
      variant={variant}
      className={`whatsapp-button ${className}`}
    >
      <MessageSquare className="mr-2 h-4 w-4" />
      {children || 'Send Inquiry via WhatsApp'}
    </Button>
  );
}
