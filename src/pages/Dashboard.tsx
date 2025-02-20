
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { Package, FileText, Users, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const stats = [
    {
      title: "Low Stock Items",
      value: "12",
      description: "Items need reordering",
      icon: Package,
      color: "text-red-500",
      trend: "-2",
      trendDirection: "down"
    },
    {
      title: "Pending Prescriptions",
      value: "28",
      description: "Awaiting processing",
      icon: FileText,
      color: "text-blue-500",
      trend: "+5",
      trendDirection: "up"
    },
    {
      title: "Active Patients",
      value: "1,284",
      description: "This month",
      icon: Users,
      color: "text-green-500",
      trend: "+12",
      trendDirection: "up"
    },
    {
      title: "Expiring Items",
      value: "6",
      description: "Within 30 days",
      icon: AlertTriangle,
      color: "text-yellow-500",
      trend: "+1",
      trendDirection: "up"
    },
  ];

  return (
    <DashboardLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-neutral-900"
          >
            Welcome back, John
          </motion.h1>
          <p className="text-neutral-600 mt-2">Here's what's happening in your pharmacy today</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-neutral-600">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className={`flex items-center text-sm ${
                      stat.trendDirection === "up" ? "text-green-500" : "text-red-500"
                    }`}>
                      {stat.trendDirection === "up" ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                      {stat.trend}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Activity
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (i * 0.1) }}
                      className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-0 hover:bg-neutral-50 transition-colors duration-200 rounded-lg p-2"
                    >
                      <div>
                        <p className="font-medium">Prescription Filled</p>
                        <p className="text-sm text-neutral-600">
                          By Dr. Smith for Patient #{i}
                        </p>
                      </div>
                      <span className="text-sm text-neutral-600">2h ago</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Inventory Alerts
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (i * 0.1) }}
                      className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-0 hover:bg-neutral-50 transition-colors duration-200 rounded-lg p-2"
                    >
                      <div>
                        <p className="font-medium">Low Stock Alert</p>
                        <p className="text-sm text-neutral-600">
                          Medication #{i} - Current stock: 5
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="hover:bg-primary hover:text-white transition-colors">
                        Reorder
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
