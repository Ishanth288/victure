import LegalLayout from "@/components/layouts/LegalLayout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <>
      <h2 className="text-3xl font-bold mt-2 mb-4">Privacy Policy</h2>
      
      <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
        <Info className="h-4 w-4" />
        <AlertTitle>Last Updated: {new Date().toLocaleDateString()}</AlertTitle>
        <AlertDescription>
          This policy applies to all services provided by Victure Healthcare Solutions.
        </AlertDescription>
      </Alert>
      
      <h2>1. Introduction</h2>
      <p>At Victure Healthcare Solutions ("Victure," "we," "us," or "our"), we respect your privacy and are committed to protecting the personal information that you share with us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our pharmacy management software and services (the "Service").</p>
      
      <h2>2. Information We Collect</h2>
      <p><strong>Personal Information:</strong> We collect information that personally identifies you, such as your name, email address, phone number, and business information when you register for and use our Service.</p>
      <p><strong>Pharmacy Data:</strong> We collect pharmacy-related data, including inventory details, prescriptions, and billing information that you input into the Service.</p>
      <p><strong>Usage Data:</strong> We collect information about how you access and use our Service, including your IP address, browser type, operating system, and other technical information.</p>
      
      <h2>3. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, maintain, and improve our Service</li>
        <li>Process transactions and send related information</li>
        <li>Respond to your comments, questions, and requests</li>
        <li>Send you technical notices, updates, security alerts, and support messages</li>
        <li>Monitor and analyze trends, usage, and activities in connection with our Service</li>
        <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
      </ul>
      
      <h2>4. Legal Basis for Processing (GDPR)</h2>
      <p>Under the EU General Data Protection Regulation (GDPR), we process your personal data based on the following legal grounds:</p>
      <ul>
        <li><strong>Contract performance:</strong> Processing necessary for the performance of our contract with you</li>
        <li><strong>Legitimate interests:</strong> Processing necessary for our legitimate interests, such as fraud prevention and network security</li>
        <li><strong>Legal compliance:</strong> Processing necessary for compliance with our legal obligations</li>
        <li><strong>Consent:</strong> Processing based on your specific consent</li>
      </ul>
      
      <h2>5. Data Retention</h2>
      <p>We retain different types of data for different periods:</p>
      <ul>
        <li><strong>Account data:</strong> While your account is active plus 30 days after deletion</li>
        <li><strong>Transaction data:</strong> 7 years for financial compliance</li>
        <li><strong>Usage data:</strong> 13 months for analytics purposes</li>
      </ul>
      
      <h2>6. Data Security</h2>
      <p>We implement appropriate technical and organizational measures to protect the security of your personal information, including:</p>
      <ul>
        <li>Encryption of sensitive data at rest and in transit</li>
        <li>Regular security assessments and penetration testing</li>
        <li>Employee training on data security practices</li>
        <li>Access controls and authentication systems</li>
        <li>Business continuity and disaster recovery plans</li>
      </ul>
      
      <h2>7. Data Sharing</h2>
      <p>We do not sell your personal information to third parties. We may share your information with:</p>
      <ul>
        <li>Service providers who perform services on our behalf</li>
        <li>Professional advisors, such as lawyers, auditors, and insurers</li>
        <li>Government and regulatory authorities when required by law</li>
      </ul>
      
      <h2>8. Your Rights</h2>
      <p>Depending on your location, you may have certain rights regarding your personal information, including the right to:</p>
      <ul>
        <li>Access the personal information we hold about you</li>
        <li>Correct inaccurate personal information</li>
        <li>Delete your personal information</li>
        <li>Object to or restrict our processing of your personal information</li>
        <li>Data portability</li>
        <li>Withdraw consent (where processing is based on consent)</li>
        <li>Lodge a complaint with a supervisory authority</li>
      </ul>
      
      <p className="mt-4">To exercise these rights, please contact us using the details in the "Contact Us" section below.</p>
      
      <h2>9. California Privacy Rights (CCPA)</h2>
      <p>If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA):</p>
      <ul>
        <li>Right to know about personal information collected, disclosed, or sold</li>
        <li>Right to delete personal information</li>
        <li>Right to opt-out of the sale of personal information</li>
        <li>Right to non-discrimination for exercising your rights</li>
      </ul>
      
      <p className="mt-4">For more information or to exercise your California privacy rights, please see our <Button variant="link" className="inline p-0 h-auto font-normal" onClick={() => window.open('#footer', '_self')}>CCPA Notice</Button> or contact us.</p>
      
      <h2>10. International Data Transfers</h2>
      <p>We process data on servers in the United States and European Union. For transfers from the EU to the US, we comply with applicable data protection laws and may use mechanisms such as Standard Contractual Clauses or the EU-US Data Privacy Framework.</p>
      
      <h2>11. Changes to This Privacy Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and providing notice at least 3 days before the changes become effective.</p>
      
      <h2>12. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact us at:</p>
      <ul>
        <li>Email: <a href="mailto:privacy@victure.com" className="text-primary hover:underline">privacy@victure.com</a></li>
        <li>Postal Address: 123 Pharmacy Lane, Suite 100, MediCity, CA 90210, USA</li>
        <li>Data Protection Officer: <a href="mailto:dpo@victure.com" className="text-primary hover:underline">dpo@victure.com</a></li>
      </ul>
      
      <div className="flex gap-4 mt-8 mb-4">
        <Button variant="outline" onClick={() => window.open('#footer', '_self')}>
          Manage Cookie Preferences
        </Button>
        <Link to="/legal/terms">
          <Button variant="outline">
            Terms of Service
          </Button>
        </Link>
      </div>
    </>
  );
}
