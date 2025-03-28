
import LegalLayout from "@/components/layouts/LegalLayout";

export default function EULA() {
  return (
    <LegalLayout title="End User License Agreement (EULA)">
      <h2>1. Introduction</h2>
      <p>This End User License Agreement ("EULA") is a legal agreement between you (either an individual or a single entity) and Victure Healthcare Solutions ("Victure," "we," "us," or "our") for the Victure pharmacy management software and any associated documentation (the "Software").</p>
      
      <h2>2. License Grant</h2>
      <p>Subject to your compliance with the terms of this EULA, Victure grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Software for your internal business purposes.</p>
      
      <h2>3. Restrictions</h2>
      <p>You may not:</p>
      <ul>
        <li>Copy, modify, or create derivative works of the Software</li>
        <li>Reverse engineer, decompile, or disassemble the Software</li>
        <li>Rent, lease, loan, sell, sublicense, or transfer the Software to any third party</li>
        <li>Remove, alter, or obscure any proprietary notices on the Software</li>
        <li>Use the Software for any illegal purpose or in any manner that violates any applicable laws or regulations</li>
      </ul>
      
      <h2>4. Ownership</h2>
      <p>The Software is owned and copyrighted by Victure. Your license confers no title or ownership in the Software and is not a sale of any rights in the Software.</p>
      
      <h2>5. Updates and Maintenance</h2>
      <p>Victure may, at its discretion, provide updates, enhancements, or new versions of the Software. Victure will notify users at least 1 week in advance (twice) via email or phone before any scheduled maintenance.</p>
      
      <h2>6. Support</h2>
      <p>Victure provides support for the Software via:</p>
      <ul>
        <li>Email: victurehealthcaresolutions@gmail.com</li>
        <li>Phone: 9390621556</li>
        <li>Chat: WhatsApp only</li>
      </ul>
      <p>Support hours are:</p>
      <ul>
        <li>Weekdays: 6 PM - 12 AM</li>
        <li>Weekends: 11 AM - 11 PM</li>
      </ul>
      
      <h2>7. Termination</h2>
      <p>This EULA is effective until terminated. You may terminate it at any time by contacting victurehealthcaresolutions@gmail.com at least one week in advance and ceasing all use of the Software.</p>
      <p>Victure may terminate this EULA if you fail to comply with any of its terms and conditions. Upon termination, you must cease all use of the Software and destroy all copies of the Software in your possession.</p>
      
      <h2>8. Disclaimer of Warranty</h2>
      <p>THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. VICTURE DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT.</p>
      
      <h2>9. Limitation of Liability</h2>
      <p>IN NO EVENT SHALL VICTURE BE LIABLE FOR ANY SPECIAL, INCIDENTAL, INDIRECT, OR CONSEQUENTIAL DAMAGES WHATSOEVER ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THE SOFTWARE.</p>
      
      <h2>10. Contact Information</h2>
      <p>If you have any questions about this EULA, please contact us at victurehealthcaresolutions@gmail.com.</p>
      
      <p>Last Updated: {new Date().toLocaleDateString()}</p>
    </LegalLayout>
  );
}
