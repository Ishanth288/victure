import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function LegalFooter() {
  const [isGdprOpen, setIsGdprOpen] = useState(false);
  const [isCcpaOpen, setIsCcpaOpen] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(() => {
    const stored = localStorage.getItem('analytics-consent');
    return stored ? JSON.parse(stored) : true;
  });
  const [marketingConsent, setMarketingConsent] = useState(() => {
    const stored = localStorage.getItem('marketing-consent');
    return stored ? JSON.parse(stored) : false;
  });

  const handleAnalyticsChange = (checked: boolean) => {
    setAnalyticsConsent(checked);
    localStorage.setItem('analytics-consent', JSON.stringify(checked));
    
    // Apply analytics consent changes
    if (typeof window.gtag !== 'undefined') {
      window.gtag('consent', 'update', {
        'analytics_storage': checked ? 'granted' : 'denied'
      });
    }
  };

  const handleMarketingChange = (checked: boolean) => {
    setMarketingConsent(checked);
    localStorage.setItem('marketing-consent', JSON.stringify(checked));
    
    // Apply marketing consent changes
    if (typeof window.gtag !== 'undefined') {
      window.gtag('consent', 'update', {
        'ad_storage': checked ? 'granted' : 'denied'
      });
    }
  };

  return (
    <div className="bg-gray-100 py-4 border-t">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-xs text-gray-500 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Victure. All rights reserved.
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xs text-gray-700">SSL Secured</span>
            </div>
            
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setIsGdprOpen(true)}
              className="text-xs px-2 py-1 h-auto"
            >
              GDPR Compliance
            </Button>
            
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setIsCcpaOpen(true)}
              className="text-xs px-2 py-1 h-auto"
            >
              CCPA Notice
            </Button>
            
            <Link to="/legal/privacy">
              <Button 
                variant="link" 
                size="sm" 
                className="text-xs px-2 py-1 h-auto"
              >
                Privacy Policy
              </Button>
            </Link>
            
            <Link to="/legal/terms">
              <Button 
                variant="link" 
                size="sm" 
                className="text-xs px-2 py-1 h-auto"
              >
                Terms of Service
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* GDPR Dialog */}
      <Dialog open={isGdprOpen} onOpenChange={setIsGdprOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>GDPR Compliance</DialogTitle>
            <DialogDescription>
              Privacy settings and cookie preferences
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Your Privacy Choices</h3>
                <p className="text-sm text-gray-500">
                  Under the General Data Protection Regulation (GDPR), you have the right to control how your personal data is used. Adjust your preferences below.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border p-4 rounded-lg">
                  <div>
                    <h4 className="font-medium">Essential Cookies</h4>
                    <p className="text-sm text-gray-500">Required for the website to function properly. These cannot be disabled.</p>
                  </div>
                  <Switch checked={true} disabled />
                </div>
                
                <div className="flex items-center justify-between border p-4 rounded-lg">
                  <div>
                    <h4 className="font-medium">Analytics Cookies</h4>
                    <p className="text-sm text-gray-500">Help us understand how you use our website.</p>
                  </div>
                  <Switch 
                    checked={analyticsConsent} 
                    onCheckedChange={handleAnalyticsChange} 
                    id="analytics-consent"
                  />
                </div>
                
                <div className="flex items-center justify-between border p-4 rounded-lg">
                  <div>
                    <h4 className="font-medium">Marketing Cookies</h4>
                    <p className="text-sm text-gray-500">Allow us to provide personalized marketing content.</p>
                  </div>
                  <Switch 
                    checked={marketingConsent} 
                    onCheckedChange={handleMarketingChange}
                    id="marketing-consent"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Your Rights Under GDPR</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                  <li>The right to access your personal data</li>
                  <li>The right to rectify inaccurate personal data</li>
                  <li>The right to erasure ("right to be forgotten")</li>
                  <li>The right to restrict processing</li>
                  <li>The right to data portability</li>
                  <li>The right to object to processing</li>
                  <li>Rights related to automated decision making and profiling</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Contact Our DPO</h3>
                <p className="text-sm text-gray-500">
                  If you have any questions about how we handle your data or wish to exercise your rights, please contact our Data Protection Officer at <a href="mailto:dpo@victure.com" className="text-blue-600 hover:underline">dpo@victure.com</a>.
                </p>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button onClick={() => setIsGdprOpen(false)}>
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* CCPA Dialog */}
      <Dialog open={isCcpaOpen} onOpenChange={setIsCcpaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>California Consumer Privacy Act (CCPA) Notice</DialogTitle>
            <DialogDescription>
              Information for California residents
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-500 mt-1 h-5 w-5" />
                <p className="text-sm">
                  This privacy notice supplements our Privacy Policy and applies only to California residents.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Your Rights Under CCPA</h3>
                <p className="text-sm text-gray-600 mb-4">
                  The California Consumer Privacy Act (CCPA) provides California residents with specific rights regarding their personal information. This section describes your CCPA rights and explains how to exercise those rights.
                </p>
                
                <ul className="list-disc pl-5 space-y-3 text-sm text-gray-600">
                  <li>
                    <strong>Right to Know:</strong> You have the right to request that we disclose certain information to you about our collection and use of your personal information over the past 12 months.
                  </li>
                  <li>
                    <strong>Right to Delete:</strong> You have the right to request that we delete any of your personal information that we collected from you and retained, subject to certain exceptions.
                  </li>
                  <li>
                    <strong>Right to Opt-Out of Sale:</strong> We do not sell your personal information. However, if we decide to do so in the future, you will have the right to direct us not to sell your personal information.
                  </li>
                  <li>
                    <strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising any of your CCPA rights.
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Exercising Your Rights</h3>
                <p className="text-sm text-gray-600">
                  To exercise your rights described above, please submit a verifiable consumer request to us by either:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2 text-sm text-gray-600">
                  <li>Calling us at <a href="tel:+18005551234" className="text-blue-600 hover:underline">1-800-555-1234</a></li>
                  <li>Visiting <a href="https://www.victure.com/privacy" className="text-blue-600 hover:underline">www.victure.com/privacy</a></li>
                  <li>Emailing <a href="mailto:privacy@victure.com" className="text-blue-600 hover:underline">privacy@victure.com</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Shine the Light Law</h3>
                <p className="text-sm text-gray-600">
                  California's "Shine the Light" law permits users of our website that are California residents to request certain information regarding our disclosure of personal information to third parties for their direct marketing purposes. To make such a request, please contact us at the information provided above.
                </p>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button onClick={() => setIsCcpaOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
