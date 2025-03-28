
import LegalLayout from "@/components/layouts/LegalLayout";

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy">
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
      
      <h2>4. Data Retention</h2>
      <p>We retain your data for a period of 1 year. After this period, your data may be permanently deleted from our systems.</p>
      
      <h2>5. Data Security</h2>
      <p>We implement appropriate technical and organizational measures to protect the security of your personal information. However, please be aware that no method of transmission over the internet or electronic storage is 100% secure.</p>
      
      <h2>6. Data Sharing</h2>
      <p>We do not sell your personal information to third parties. We may share your information with:</p>
      <ul>
        <li>Service providers who perform services on our behalf</li>
        <li>Professional advisors, such as lawyers, auditors, and insurers</li>
        <li>Government and regulatory authorities when required by law</li>
      </ul>
      
      <h2>7. Your Rights</h2>
      <p>Depending on your location, you may have certain rights regarding your personal information, including the right to:</p>
      <ul>
        <li>Access the personal information we hold about you</li>
        <li>Correct inaccurate personal information</li>
        <li>Delete your personal information</li>
        <li>Object to or restrict our processing of your personal information</li>
        <li>Data portability</li>
      </ul>
      
      <h2>8. Changes to This Privacy Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and providing notice at least 3 days before the changes become effective.</p>
      
      <h2>9. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact us at victurehealthcaresolutions@gmail.com.</p>
      
      <p>Last Updated: {new Date().toLocaleDateString()}</p>
    </LegalLayout>
  );
}
