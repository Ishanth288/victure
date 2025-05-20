
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function LegalFooter() {
  const [isGdprOpen, setIsGdprOpen] = useState(false);
  const [isCcpaOpen, setIsCcpaOpen] = useState(false);
  const [isDataPolicyOpen, setIsDataPolicyOpen] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(() => {
    const stored = localStorage.getItem('analytics-consent');
    return stored ? JSON.parse(stored) : false;
  });
  const [marketingConsent, setMarketingConsent] = useState(() => {
    const stored = localStorage.getItem('marketing-consent');
    return stored ? JSON.parse(stored) : false;
  });
  const [thirdPartyConsent, setThirdPartyConsent] = useState(() => {
    const stored = localStorage.getItem('third-party-consent');
    return stored ? JSON.parse(stored) : false;
  });
  const [preferencesChanged, setPreferencesChanged] = useState(false);

  // Effect to track if preferences have changed from initial state
  useEffect(() => {
    const storedAnalytics = localStorage.getItem('analytics-consent');
    const storedMarketing = localStorage.getItem('marketing-consent');
    const storedThirdParty = localStorage.getItem('third-party-consent');
    
    const initialAnalytics = storedAnalytics ? JSON.parse(storedAnalytics) : false;
    const initialMarketing = storedMarketing ? JSON.parse(storedMarketing) : false;
    const initialThirdParty = storedThirdParty ? JSON.parse(storedThirdParty) : false;
    
    setPreferencesChanged(
      initialAnalytics !== analyticsConsent ||
      initialMarketing !== marketingConsent ||
      initialThirdParty !== thirdPartyConsent
    );
  }, [analyticsConsent, marketingConsent, thirdPartyConsent]);

  const handleAnalyticsChange = (checked: boolean) => {
    setAnalyticsConsent(checked);
    setPreferencesChanged(true);
  };

  const handleMarketingChange = (checked: boolean) => {
    setMarketingConsent(checked);
    setPreferencesChanged(true);
  };

  const handleThirdPartyChange = (checked: boolean) => {
    setThirdPartyConsent(checked);
    setPreferencesChanged(true);
  };
  
  const savePreferences = () => {
    // Save to localStorage
    localStorage.setItem('analytics-consent', JSON.stringify(analyticsConsent));
    localStorage.setItem('marketing-consent', JSON.stringify(marketingConsent));
    localStorage.setItem('third-party-consent', JSON.stringify(thirdPartyConsent));
    
    // Apply analytics consent changes
    if (typeof window.gtag !== 'undefined') {
      window.gtag('consent', 'update', {
        'analytics_storage': analyticsConsent ? 'granted' : 'denied',
        'ad_storage': marketingConsent ? 'granted' : 'denied',
        'functionality_storage': 'granted', // Essential cookies always needed
        'personalization_storage': thirdPartyConsent ? 'granted' : 'denied',
        'security_storage': 'granted' // Security related cookies always needed
      });
    }
    
    // Reset changed state
    setPreferencesChanged(false);
    
    // Display success notification
    toast.success("Your privacy preferences have been saved", {
      description: "Your choices will be applied across your browsing session",
      duration: 5000,
    });
    
    // Close dialogs
    setIsGdprOpen(false);
  };
  
  const exportUserData = () => {
    try {
      // Gather user data from localStorage and cookies
      const userData = {
        privacyPreferences: {
          analyticsConsent,
          marketingConsent,
          thirdPartyConsent,
          timestamp: new Date().toISOString(),
        },
        // Add any other user data that would be stored
        localStorageItems: Object.keys(localStorage).reduce((data, key) => {
          if (!key.includes('password')) { // Skip sensitive data
            data[key] = localStorage.getItem(key);
          }
          return data;
        }, {} as Record<string, string | null>),
      };
      
      // Create a downloadable JSON file
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-export-${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Your data has been exported", {
        description: "A JSON file containing your data has been downloaded",
      });
    } catch (error) {
      console.error("Error exporting user data:", error);
      toast.error("Failed to export your data", {
        description: "Please try again or contact support",
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
            
            <Button 
              variant="link" 
              size="sm"
              onClick={() => setIsDataPolicyOpen(true)}
              className="text-xs px-2 py-1 h-auto"
            >
              Data Handling
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
          
          {preferencesChanged && (
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unsaved changes</AlertTitle>
              <AlertDescription>
                You've made changes to your privacy preferences. Don't forget to save them.
              </AlertDescription>
            </Alert>
          )}
          
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
                  <div className="flex items-center gap-2">
                    <Label htmlFor="analytics-consent" className="sr-only">Analytics consent</Label>
                    <Switch 
                      checked={analyticsConsent} 
                      onCheckedChange={handleAnalyticsChange} 
                      id="analytics-consent"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between border p-4 rounded-lg">
                  <div>
                    <h4 className="font-medium">Marketing Cookies</h4>
                    <p className="text-sm text-gray-500">Allow us to provide personalized marketing content.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="marketing-consent" className="sr-only">Marketing consent</Label>
                    <Switch 
                      checked={marketingConsent} 
                      onCheckedChange={handleMarketingChange}
                      id="marketing-consent"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between border p-4 rounded-lg">
                  <div>
                    <h4 className="font-medium">Third-Party Cookies</h4>
                    <p className="text-sm text-gray-500">Allow third-party services to enhance your experience.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="third-party-consent" className="sr-only">Third-party consent</Label>
                    <Switch 
                      checked={thirdPartyConsent} 
                      onCheckedChange={handleThirdPartyChange}
                      id="third-party-consent"
                    />
                  </div>
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
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Export Your Data</h3>
                <p className="text-sm text-gray-600 mb-2">
                  You have the right to access all personal data we have collected about you. Click below to download a copy.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportUserData} 
                  className="mb-4"
                >
                  Export My Data
                </Button>
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
            <Button 
              variant="outline" 
              onClick={() => setIsGdprOpen(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              onClick={savePreferences} 
              disabled={!preferencesChanged}
            >
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
                <Info className="text-amber-500 mt-1 h-5 w-5" />
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
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Do Not Sell My Personal Information</h3>
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Although we do not currently sell personal information, you can opt out of future sales.
                    </p>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium">You are currently opted out of data sales</p>
                    </div>
                  </div>
                </div>
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
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Export Your California Data</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Under the CCPA, you have the right to access all personal data we have collected about you.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportUserData} 
                  className="mb-4"
                >
                  Export My California Data
                </Button>
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

      {/* New Data Handling Policy Dialog */}
      <Dialog open={isDataPolicyOpen} onOpenChange={setIsDataPolicyOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Data Handling Policy</DialogTitle>
            <DialogDescription>
              How we process and safeguard your data
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Data Processing Principles</h3>
                <p className="text-sm text-gray-600 mb-4">
                  At Victure, we follow these key principles when handling your data:
                </p>
                
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                  <li><strong>Lawfulness, fairness and transparency</strong>: We process data lawfully and transparently.</li>
                  <li><strong>Purpose limitation</strong>: We collect data for specified, explicit purposes.</li>
                  <li><strong>Data minimization</strong>: We limit collection to what's necessary.</li>
                  <li><strong>Accuracy</strong>: We take steps to ensure data is accurate and up-to-date.</li>
                  <li><strong>Storage limitation</strong>: We don't store data longer than necessary.</li>
                  <li><strong>Integrity and confidentiality</strong>: We implement security measures to protect your data.</li>
                </ul>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Data Retention</h3>
                <p className="text-sm text-gray-600">
                  We retain different categories of data for different periods:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2 text-sm text-gray-600">
                  <li><strong>Account data</strong>: Retained while your account is active plus 30 days after deletion</li>
                  <li><strong>Transaction data</strong>: 7 years for financial compliance</li>
                  <li><strong>Usage data</strong>: 13 months for analytics purposes</li>
                  <li><strong>Marketing preferences</strong>: Until you opt-out or update them</li>
                </ul>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">International Data Transfers</h3>
                <p className="text-sm text-gray-600">
                  We process data on servers in the United States and European Union. For transfers from the EU to the US, we comply with applicable data protection laws and may use mechanisms such as Standard Contractual Clauses or the EU-US Data Privacy Framework.
                </p>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Your Controls and Choices</h3>
                <p className="text-sm text-gray-600 mb-2">
                  You have control over your data:
                </p>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportUserData} 
                    className="w-full justify-start"
                  >
                    Export your data
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsGdprOpen(true)}
                    className="w-full justify-start"
                  >
                    Manage cookie preferences
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Data Security</h3>
                <p className="text-sm text-gray-600">
                  We implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk, including:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2 text-sm text-gray-600">
                  <li>Encryption of personal data</li>
                  <li>Regular testing and evaluation of security measures</li>
                  <li>Business continuity and disaster recovery plans</li>
                  <li>Regular staff training on data protection</li>
                  <li>Access controls and authentication systems</li>
                </ul>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button onClick={() => setIsDataPolicyOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
