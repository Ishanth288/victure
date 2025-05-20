
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface CustomerRetentionAnalysisProps {
  customers: Array<{
    phone: string;
    visits: number;
    totalSpent: number;
    bills?: Array<any>;
  }>;
  isLoading: boolean;
}

export function CustomerRetentionAnalysis({ customers, isLoading }: CustomerRetentionAnalysisProps) {
  // Get the top 10 repeat customers by visit count
  const topCustomers = customers.slice(0, 10);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Customer Retention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <LoadingAnimation text="Loading customer data" size="sm" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (topCustomers.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Customer Retention</CardTitle>
          <CardDescription>Identifying repeat customers by phone number</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Repeat Customers</AlertTitle>
            <AlertDescription>
              No repeat customers found in the selected period. Customers are considered repeat when they have made more than one purchase.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Repeat Customer Analysis</CardTitle>
        <CardDescription>
          Customers identified by phone number who have made multiple purchases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone Number</TableHead>
              <TableHead className="text-right">Visits</TableHead>
              <TableHead className="text-right">Total Spent (₹)</TableHead>
              <TableHead className="text-right">Avg. Spend (₹)</TableHead>
              <TableHead>Last Visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topCustomers.map((customer, index) => {
              // Calculate average spend per visit
              const avgSpend = customer.totalSpent / customer.visits;
              
              // Find the most recent bill date if available
              let lastVisit = "Unknown";
              if (customer.bills && customer.bills.length > 0) {
                const dates = customer.bills.map(bill => new Date(bill.date));
                const mostRecent = new Date(Math.max(...dates.map(date => date.getTime())));
                lastVisit = formatDistanceToNow(mostRecent, { addSuffix: true });
              }
              
              // Format phone number for display
              const formattedPhone = customer.phone.replace(/(\d{3})(\d{3})(\d{4})/, function(_, p1, p2, p3) {
                return p1 + "-" + p2 + "-" + p3;
              });

              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{formattedPhone}</TableCell>
                  <TableCell className="text-right">{customer.visits}</TableCell>
                  <TableCell className="text-right">{customer.totalSpent.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{avgSpend.toFixed(2)}</TableCell>
                  <TableCell>{lastVisit}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
