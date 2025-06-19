

import LegalLayout from "@/components/layouts/LegalLayout";
import { SEO } from "@/components/SEO/index.tsx";

export default function SLA() {
  return (
    <>
      <SEO
        title="Service Level Agreement (SLA) | Victure Pharmacy SaaS"
        description="Read Victure's SLA for Indian clinics. Learn about uptime, support, and data protection for our pharmacy management SaaS."
        canonicalUrl="https://victure.in/legal/sla"
      />
      <h2 className="text-3xl font-bold mt-2 mb-4">Service Level Agreement (SLA)</h2>
      
      <h2>1. Introduction</h2>
      <p>This Service Level Agreement ("SLA") is part of the agreement between Victure Healthcare Solutions ("Victure," "we," "us," or "our") and the customer ("you" or "your") for the provision of our pharmacy management software and services (the "Service").</p>
      
      <h2>2. Service Availability</h2>
      <p>Victure commits to making the Service available 99.5% of the time, measured on a monthly basis, excluding scheduled maintenance periods.</p>
      
      <h2>3. Scheduled Maintenance</h2>
      <p>Victure will perform scheduled maintenance to the Service as necessary. We will notify you at least 1 week in advance (twice) via email or phone before any scheduled maintenance.</p>
      
      <h2>4. Support Response Times</h2>
      <p>Victure will respond to support requests based on the following priority levels:</p>
      <ul>
        <li><strong>Critical Issues:</strong> Issues that cause a complete service outage or severe impact to business operations - Response within 2 hours during support hours</li>
        <li><strong>High Priority:</strong> Issues that significantly impair service functionality but have a workaround - Response within 4 hours during support hours</li>
        <li><strong>Medium Priority:</strong> Issues that moderately impact service functionality - Response within 8 hours during support hours</li>
        <li><strong>Low Priority:</strong> General questions, feature requests, or minor issues - Response within 24 hours during support hours</li>
      </ul>
      
      <h2>5. Support Hours</h2>
      <p>Victure provides support during the following hours:</p>
      <ul>
        <li>Weekdays: 6 PM - 12 AM</li>
        <li>Weekends: 11 AM - 11 PM</li>
      </ul>
      <p>Support is available via:</p>
      <ul>
        <li>Email: victurehealthcaresolutions@gmail.com</li>
        <li>Phone: 9390621556</li>
        <li>Chat: WhatsApp only</li>
      </ul>
      
      <h2>6. Data Backup and Recovery</h2>
      <p>Victure will perform regular backups of all customer data. In the event of data loss, Victure will use commercially reasonable efforts to restore data from the most recent backup.</p>
      
      <h2>7. Data Retention</h2>
      <p>Victure will retain your data for a period of 1 year. After this period, your data may be permanently deleted from our systems.</p>
      
      <h2>8. Security Measures</h2>
      <p>Victure implements industry-standard security measures to protect your data, including but not limited to encryption, access controls, and regular security assessments.</p>
      
      <h2>9. Service Credits</h2>
      <p>If Victure fails to meet the service availability commitment in any month, you may request a service credit. Service credits are calculated as a percentage of the monthly service fee for the affected month and are applied to future service fees.</p>
      
      <h2>10. Modifications</h2>
      <p>Victure reserves the right to modify this SLA at any time. We will provide notice of any material changes at least 3 days before they become effective.</p>
      
      <h2>11. Contact Information</h2>
      <p>If you have any questions about this SLA, please contact us at victurehealthcaresolutions@gmail.com.</p>
      
      <p>Last Updated: {new Date().toLocaleDateString()}</p>
    </>
  );
}

