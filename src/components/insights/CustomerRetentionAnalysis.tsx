
import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, Smartphone } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Memoize the processed customer data to avoid unnecessary recalculations
  const topCustomers = useMemo(() => {
    // Get the top 10 repeat customers by visit count
    return customers.slice(0, 10);
  }, [customers]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Customer Retention
          </CardTitle>
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
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Customer Retention
          </CardTitle>
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

  // Render different layouts for mobile and desktop
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" />
          Repeat Customer Analysis
        </CardTitle>
        <CardDescription>
          Customers identified by phone number who have made multiple purchases
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          <MobileCustomerList customers={topCustomers} />
        ) : (
          <DesktopCustomerTable customers={topCustomers} />
        )}
      </CardContent>
    </Card>
  );
}

// Desktop table view component
const DesktopCustomerTable = ({ customers }: { customers: CustomerRetentionAnalysisProps['customers'] }) => (
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
      {customers.map((customer, index) => {
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
);

// Mobile card view component
const MobileCustomerList = ({ customers }: { customers: CustomerRetentionAnalysisProps['customers'] }) => (
  <ScrollArea className="h-[400px] pr-4">
    <div className="space-y-4">
      {customers.map((customer, index) => {
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
          <div key={index} className="p-4 border rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">{formattedPhone}</span>
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                {customer.visits} visits
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>
                <div className="text-gray-500">Total Spent</div>
                <div className="font-medium">₹{customer.totalSpent.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500">Avg. Spend</div>
                <div className="font-medium">₹{avgSpend.toFixed(2)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500">Last Visit</div>
                <div className="font-medium">{lastVisit}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </ScrollArea>
);
