

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { SEOHead } from "@/components/SEO/SEOHead";

export default function RefundPolicy() {
  return (
    <>
      <SEOHead
        title="Refund & Cancellation Policy | Victure Pharmacy SaaS"
        description="Review Victure's refund and cancellation policy for Indian clinics. Learn about our terms for subscription, billing, and support."
        canonicalUrl="https://victure.in/legal/RefundPolicy"
        pageType="legal"
      />
      <h2 className="text-3xl font-bold mt-2 mb-4">Refund & Cancellation Policy</h2>
      
      <h2>1. Introduction</h2>
      <p>This Refund & Cancellation Policy outlines the terms and conditions for refunds and cancellations of Victure Healthcare Solutions ("Victure," "we," "us," or "our") pharmacy management software and services (the "Service").</p>
      
      <h2>2. Free Trial</h2>
      <p>Victure offers a 30-day free trial of the Service. No payment is required during the trial period.</p>
      <p>If you do not cancel your subscription before the end of the trial period, you will be automatically charged for the subscription plan you selected during registration.</p>
      
      <h2>3. Subscription Cancellation</h2>
      <p>You may cancel your subscription at any time by contacting us at victurehealthcaresolutions@gmail.com at least one week in advance of your intended cancellation date.</p>
      <p>Upon cancellation:</p>
      <ul>
        <li>You will have access to the Service until the end of your current billing period</li>
        <li>Your account will be deactivated at the end of your current billing period</li>
        <li>Your data will be retained for 1 year after cancellation, after which it may be permanently deleted from our systems</li>
      </ul>
      
      <h2>4. Refund Policy</h2>
      <p>Refunds may be considered on a case-by-case basis and are generally available under the following conditions:</p>
      <ul>
        <li>Technical issues: If you experience significant technical issues that prevent you from using the Service, and our support team is unable to resolve these issues within a reasonable timeframe, you may be eligible for a refund</li>
        <li>Billing errors: If you have been incorrectly charged or double-charged for the Service, you will receive a full refund for the incorrect charges</li>
      </ul>
      <p>To request a refund, please contact us at victurehealthcaresolutions@gmail.com with your account details and the reason for your refund request.</p>
      
      <h2>5. Non-Refundable Items</h2>
      <p>The following items are generally non-refundable:</p>
      <ul>
        <li>Partial month or partial billing period fees</li>
        <li>Set-up fees or implementation fees</li>
        <li>Add-on features or services</li>
        <li>Services already rendered</li>
      </ul>
      
      <h2>6. Payment Processing</h2>
      <p>Refunds will be processed using the same payment method used for the original purchase. Depending on your payment provider, it may take 5-10 business days for the refund to appear in your account.</p>
      
      <h2>7. Modifications</h2>
      <p>Victure reserves the right to modify this Refund & Cancellation Policy at any time. We will provide notice of any material changes at least 3 days before they become effective.</p>
      
      <h2>8. Contact Information</h2>
      <p>If you have any questions about this Refund & Cancellation Policy, please contact us at victurehealthcaresolutions@gmail.com.</p>
      
      <p>Last Updated: {new Date().toLocaleDateString()}</p>
    </>
  );
}

