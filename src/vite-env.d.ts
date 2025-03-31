
/// <reference types="vite/client" />

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler?: (response: any) => void;
}

interface RazorpayInstance {
  open: () => void;
}

interface Razorpay {
  new(options: RazorpayOptions): RazorpayInstance;
}

interface Window {
  Razorpay: Razorpay;
  gtag?: (command: string, action: string, params: object) => void;
}
