
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { Package, FileText, Users, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Low Stock Items",
      value: "12",
      description: "Items need reordering",
      icon: Package,
      color: "text-red-500",
    },
    {
      title: "Pending Prescriptions",
      value: "28",
      description: "Awaiting processing",
      icon: FileText,
      color: "text-blue-500",
    },
    {
      title: "Active Patients",
      value: "1,284",
      description: "This month",
      icon: Users,
      color: "text-green-500",
    },
    {
      title: "Expiring Items",
      value: "6",
      description: "Within 30 days",
      icon: AlertTriangle,
      color: "text-yellow-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-600 mt-2">Welcome back, John</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-neutral-600 mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-0"
                  >
                    <div>
                      <p className="font-medium">Prescription Filled</p>
                      <p className="text-sm text-neutral-600">
                        By Dr. Smith for Patient #{i}
                      </p>
                    </div>
                    <span className="text-sm text-neutral-600">2h ago</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-0"
                  >
                    <div>
                      <p className="font-medium">Low Stock Alert</p>
                      <p className="text-sm text-neutral-600">
                        Medication #{i} - Current stock: 5
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Reorder
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
