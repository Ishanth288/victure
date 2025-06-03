import LegalLayout from "@/components/layouts/LegalLayout";

export default function AcceptableUsePolicy() {
  return (
    <>
      <h2 className="text-3xl font-bold mt-2 mb-4">Acceptable Use Policy</h2>
      
      <h2>1. Introduction</h2>
      <p>This Acceptable Use Policy ("Policy") outlines the acceptable uses of Victure Healthcare Solutions ("Victure," "we," "us," or "our") pharmacy management software and services (the "Service"). This Policy is designed to protect the Service, our users, and the public from harm.</p>
      
      <h2>2. General Conduct</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>Violate any applicable laws, regulations, or industry standards</li>
        <li>Infringe upon the intellectual property rights of others</li>
        <li>Transmit any material that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, invasive of another's privacy, or otherwise objectionable</li>
        <li>Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity</li>
        <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
        <li>Attempt to gain unauthorized access to the Service, other accounts, computer systems, or networks connected to the Service</li>
      </ul>
      
      <h2>3. Data and Content</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>Upload, post, or transmit any content that contains viruses, worms, malware, Trojan horses, or any other harmful or destructive content</li>
        <li>Upload, post, or transmit any content that is illegal or violates any applicable laws or regulations</li>
        <li>Collect, store, or process personal information of other users without their explicit consent</li>
        <li>Use the Service for any fraudulent or deceptive purposes</li>
      </ul>
      
      <h2>4. System Integrity</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Attempt to probe, scan, or test the vulnerability of the Service or any related system or network</li>
        <li>Breach or otherwise circumvent any security or authentication measures</li>
        <li>Access, tamper with, or use non-public areas of the Service, our computer systems, or the technical delivery systems of our providers</li>
        <li>Interfere with, or attempt to interfere with, the access of any user, host, or network, including sending a virus, overloading, flooding, spamming, or mail-bombing the Service</li>
      </ul>
      
      <h2>5. Pharmacy Specific Requirements</h2>
      <p>As a pharmacy management system, you agree to:</p>
      <ul>
        <li>Comply with all applicable pharmacy laws and regulations</li>
        <li>Maintain appropriate licenses and certifications required for pharmacy operations</li>
        <li>Handle all prescription and patient data in accordance with healthcare privacy laws and regulations</li>
        <li>Ensure proper access controls for pharmacy staff using the Service</li>
      </ul>
      
      <h2>6. Monitoring and Enforcement</h2>
      <p>Victure reserves the right to:</p>
      <ul>
        <li>Monitor your use of the Service for compliance with this Policy</li>
        <li>Investigate any suspected violations of this Policy</li>
        <li>Take appropriate action against any user who, in our sole discretion, violates this Policy</li>
        <li>Terminate or suspend access to the Service for users who violate this Policy</li>
      </ul>
      <p>Victure may report any activity that we suspect violates any law or regulation to appropriate law enforcement officials or regulatory bodies.</p>
      
      <h2>7. Modifications</h2>
      <p>Victure reserves the right to modify this Policy at any time. We will provide notice of any material changes at least 3 days before they become effective.</p>
      
      <h2>8. Contact Information</h2>
      <p>If you have any questions about this Policy or to report any violations, please contact us at victurehealthcaresolutions@gmail.com.</p>
      
      <p>Last Updated: {new Date().toLocaleDateString()}</p>
    </>
  );
}
