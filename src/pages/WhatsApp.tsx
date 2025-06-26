import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { connectWhatsApp, disconnectWhatsApp, sendMessage, getMessageHistory } from '@/services/whatsappService';

export default function WhatsAppPage() {
  const { toast } = useToast();
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messageHistory, setMessageHistory] = useState([]);
  const [automatedMessages, setAutomatedMessages] = useState({
    appointmentReminders: true,
    prescriptionRefills: true,
    followUpCare: false,
  });
  const [newMessage, setNewMessage] = useState({ to: '', body: '' });

  useEffect(() => {
    fetchMessageHistory();
  }, []);

  const fetchMessageHistory = async () => {
    try {
      const response = await getMessageHistory();
      if (response.success) {
        setMessageHistory(response.data);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Could not fetch message history.', variant: 'destructive' });
    }
  };

  const handleToggleConnection = async () => {
    setIsLoading(true);
    try {
      if (isWhatsAppConnected) {
        await disconnectWhatsApp();
        setIsWhatsAppConnected(false);
        toast({ title: 'Success', description: 'WhatsApp disconnected.' });
      } else {
        setShowQrCode(true);
        // Simulate scanning QR code
        setTimeout(async () => {
          try {
            await connectWhatsApp();
            setIsWhatsAppConnected(true);
            setShowQrCode(false);
            toast({ title: 'Success', description: 'WhatsApp connected successfully.' });
          } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
          }
        }, 3000);
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    setIsSending(true);
    try {
      const response = await sendMessage(newMessage.to, newMessage.body);
      if (response.success) {
        toast({ title: 'Success', description: 'Message sent successfully.' });
        setNewMessage({ to: '', body: '' });
        fetchMessageHistory(); // Refresh history
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setIsSending(false);
  };

  const handleToggleAutomatedMessage = (type) => {
    setAutomatedMessages((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Integration</h1>
          <p className="text-lg text-gray-600 mt-1">Manage your pharmacy's communication with patients via WhatsApp.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Panel */}
          <aside className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connection Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${isWhatsAppConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isWhatsAppConnected ? 'Connected' : 'Disconnected'}
                  </p>
                  <Button onClick={handleToggleConnection} variant={isWhatsAppConnected ? 'destructive' : 'default'} disabled={isLoading || showQrCode}>
                    {isLoading && !showQrCode ? 'Processing...' : (isWhatsAppConnected ? 'Disconnect' : 'Connect')}
                  </Button>
                </div>
                {showQrCode && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50 text-center">
                    <p className="text-sm font-medium mb-2">Scan this QR code with your phone</p>
                    <div className="w-32 h-32 bg-gray-300 mx-auto animate-pulse rounded-md flex items-center justify-center">
                      <p className="text-xs text-gray-500">Simulating QR...</p>
                    </div>
                    <Button variant="link" size="sm" className="mt-2" onClick={() => {setShowQrCode(false); setIsLoading(false);}}>Cancel</Button>
                  </div>
                )}
                {isWhatsAppConnected && <p className="text-xs text-gray-500 mt-2">Ready to send messages.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automated Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="appointmentReminders" className="text-sm font-medium">Appointment Reminders</label>
                  <Switch
                    id="appointmentReminders"
                    checked={automatedMessages.appointmentReminders}
                    onCheckedChange={() => handleToggleAutomatedMessage('appointmentReminders')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="prescriptionRefills" className="text-sm font-medium">Prescription Refills</label>
                  <Switch
                    id="prescriptionRefills"
                    checked={automatedMessages.prescriptionRefills}
                    onCheckedChange={() => handleToggleAutomatedMessage('prescriptionRefills')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="followUpCare" className="text-sm font-medium">Follow-up Care</label>
                  <Switch
                    id="followUpCare"
                    checked={automatedMessages.followUpCare}
                    onCheckedChange={() => handleToggleAutomatedMessage('followUpCare')}
                  />
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send a Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="patientPhone" className="block text-sm font-medium text-gray-700">Patient Phone Number</label>
                  <Input id="patientPhone" type="tel" placeholder="+91 98765 43210" className="mt-1" value={newMessage.to} onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="messageContent" className="block text-sm font-medium text-gray-700">Message</label>
                  <Textarea id="messageContent" placeholder="Type your message here..." className="mt-1" rows={4} value={newMessage.body} onChange={(e) => setNewMessage({ ...newMessage, body: e.target.value })} />
                </div>
                <div className="text-right">
                  <Button onClick={handleSendMessage} disabled={isSending}>
                    {isSending ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>

          {/* Message History */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Message History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messageHistory.map((msg) => (
                    <div key={msg.id} className="p-3 bg-gray-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-gray-800">To: {msg.to}</p>
                        <p className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{msg.body}</p>
                      <p className="text-xs text-right capitalize mt-2 text-gray-500">Status: {msg.status}</p>
                    </div>
                  ))}
                  {messageHistory.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No messages sent yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}