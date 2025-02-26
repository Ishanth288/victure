
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotificationSettings() {
  const [notificationEmail, setNotificationEmail] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [expiryAlert, setExpiryAlert] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage your notification settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Email Notifications</h3>
            <p className="text-sm text-gray-500">Receive updates via email</p>
          </div>
          <Button
            variant={notificationEmail ? "default" : "outline"}
            onClick={() => setNotificationEmail(!notificationEmail)}
          >
            {notificationEmail ? "Enabled" : "Disabled"}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Low Stock Alerts</h3>
            <p className="text-sm text-gray-500">Get notified when inventory is low</p>
          </div>
          <Button
            variant={lowStockAlert ? "default" : "outline"}
            onClick={() => setLowStockAlert(!lowStockAlert)}
          >
            {lowStockAlert ? "Enabled" : "Disabled"}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Expiry Alerts</h3>
            <p className="text-sm text-gray-500">Get notified about expiring medications</p>
          </div>
          <Button
            variant={expiryAlert ? "default" : "outline"}
            onClick={() => setExpiryAlert(!expiryAlert)}
          >
            {expiryAlert ? "Enabled" : "Disabled"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
