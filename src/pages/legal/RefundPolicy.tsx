import LegalLayout from "@/components/layouts/LegalLayout";
import { Link } from "react-router-dom"; // Assuming you use react-router for links

export default function RefundPolicy() {
  // --- IMPORTANT ---
  // Replace this placeholder date with the actual date you last updated the policy.
  // This should be updated manually whenever the policy text changes.
  const lastUpdatedDate = "April 4, 2025";
  // --- END IMPORTANT ---

  return (
    <LegalLayout title="Refund & Cancellation Policy">
      <p className="text-muted-foreground mb-6">Last Updated: {lastUpdatedDate}</p>

      <h2>1. Introduction</h2>
      <p>This Refund & Cancellation Policy outlines the terms and conditions for refunds and cancellations relating to Victure Healthcare Solutions ("Victure," "we," "us," or "our") pharmacy management software and services (the "Service"). We aim for this policy to be clear and fair.</p>

      <h2>2. Free Trial</h2>
      <p>We offer a free trial period (e.g., 30 days) for you to evaluate the Service. No payment information is required to start the trial unless otherwise specified during signup.</p>
      <p>If you decide to subscribe during or after the trial, you will be billed according to the plan you select. If you do not wish to subscribe, simply refrain from providing payment information or cancel before the trial ends if payment details were provided.</p>

      <h2>3. Subscription Cancellation</h2>
      <p>
        You have the flexibility to cancel your subscription at any time. The easiest way is typically through your account settings within the Service (if available).
      </p>
      <p>
        Alternatively, you can request cancellation by emailing us at <a href="mailto:victurehealthcaresolutions@gmail.com" className="text-primary hover:underline">victurehealthcaresolutions@gmail.com</a>. Please include your account email address and company name to help us process your request quickly.
      </p>
      <p>Upon cancellation:</p>
      <ul>
        <li>Your access to the Service will continue until the end of your current paid billing period.</li>
        <li>Your account will automatically deactivate, and you will not be charged again after your current billing period ends.</li>
        <li>
          Your data will be handled according to our <Link to="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>. Generally, data is retained for a specific period (e.g., 1 year) after cancellation for potential reactivation or legal compliance, after which it may be permanently deleted. Please refer to the Privacy Policy for details.
        </li>
      </ul>

      <h2>4. Refund Policy</h2>
      <p>We handle refund requests on a case-by-case basis to ensure fairness. You may be eligible for a full or partial refund under specific circumstances, such as:</p>
      <ul>
        <li>
          <strong>Significant Technical Issues:</strong> If core functionalities of the Service are unusable due to technical problems originating from our side, and our support team cannot resolve these issues within a reasonable timeframe (e.g., 7 business days) after you report them.
        </li>
        <li>
          <strong>Billing Errors:</strong> If you were charged incorrectly due to an error in our billing system (e.g., double-charged, charged the wrong amount). We will promptly refund any erroneous charges upon verification.
        </li>
      </ul>
      <p>
        To request a refund, please contact our support team via email at <a href="mailto:victurehealthcaresolutions@gmail.com" className="text-primary hover:underline">victurehealthcaresolutions@gmail.com</a>. Include your account details, the charge(s) in question, and a clear explanation of the reason for your request. We aim to process refund requests within 5-10 business days.
      </p>

      <h2>5. When Refunds Generally Don't Apply</h2>
      <p>Refunds are generally not provided for:</p>
      <ul>
        <li>Fees for the current billing period if you cancel mid-period (you retain access until the end of the period).</li>
        <li>Fees for prior billing periods, except in cases of billing errors.</li>
        <li>Any setup, implementation, training, or customization fees (if applicable).</li>
        <li>Fees for add-on services or features that have already been utilized.</li>
        <li>Situations where the Service was available and functional, but you chose not to use it.</li>
      </ul>

      <h2>6. Payment Processing</h2>
      <p>Approved refunds will typically be processed back to the original payment method used for the purchase. Please note that it may take several business days (often 5-10) for the refunded amount to reflect in your account, depending on your bank or payment provider's processing times.</p>

      <h2>7. Policy Modifications</h2>
      <p>We may update this Refund & Cancellation Policy from time to time. We will notify you of any significant changes (e.g., via email or a notice within the Service) reasonably in advance, typically at least 3-5 days before the changes take effect. Your continued use of the Service after changes become effective constitutes your acceptance of the revised policy.</p>

      <h2>8. Contact Information</h2>
      <p>
        If you have any questions about this policy, please don't hesitate to contact us:
      </p>
      <ul>
        <li>Email: <a href="mailto:victurehealthcaresolutions@gmail.com" className="text-primary hover:underline">victurehealthcaresolutions@gmail.com</a></li>
        {/* Add other contact methods if available */}
        {/* <li>Support Portal: [Link to Support Portal]</li> */}
        {/* <li>Phone: [Your Support Phone Number]</li> */}
      </ul>

    </LegalLayout>
  );
}