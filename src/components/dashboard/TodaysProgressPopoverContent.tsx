import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { XIcon, RefreshCwIcon } from 'lucide-react';

// TODO: Implement actual data fetching logic from Supabase
const fetchTodaysProgress = async () => {
  // Simulate API call - Replace with actual Supabase query
  console.warn("fetchTodaysProgress is using mock data. Replace with actual API call.");
  await new Promise(resolve => setTimeout(resolve, 500)); // Shorter delay for now
  // Return empty or default data structure until real data is implemented
  return {
    prescriptionsGenerated: 0,
    amountValueSold: '0.00',
    profitToday: '0.00',
    billsInCash: 0,
    billsInUpi: 0,
    repeatedCustomers: 0,
    // Add more metrics as needed, initialized to zero or appropriate defaults
  };
};

const TodaysProgressPopoverContent: React.FC = () => {
  const [progressData, setProgressData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTodaysProgress();
      setProgressData(data);
    } catch (error) {
      console.error("Error fetching today's progress:", error);
      // Handle error appropriately, e.g., show a toast message
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    // Removed the fixed inset-0 bg-black bg-opacity-50 overlay
    // The popover will now be positioned relative to its parent or via a portal if needed
    // For now, let's assume it's part of the normal document flow or handled by a Popover component from a UI library
    // If using ShadCN's Popover, it handles its own positioning and overlay.
    // We will wrap this in a Popover trigger/content structure later if needed.
        // This component is now the content of a Popover, so no outer div or close button is needed here.
    // The PopoverContent from ShadCN will provide the card-like structure.
    // The PopoverTrigger will handle closing.
    <Card className="w-full max-w-md rounded-lg shadow-xl border-0 bg-background">
      {/* We can remove the Card if PopoverContent already provides a suitable container, 
          but keeping it for now to maintain similar styling structure. 
          Adjust border/shadow as needed if PopoverContent handles it. */}
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Today's Progress</CardTitle>
          {/* The close button is typically part of PopoverTrigger or an explicit X in PopoverContent if desired */}
          {/* For now, relying on clicking outside or the trigger to close */}
          <Button variant="ghost" size="icon" onClick={loadData} disabled={isLoading} aria-label="Refresh progress">
            <RefreshCwIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <p>Loading progress...</p> {/* Replace with a proper spinner if available */}
            </div>
          ) : progressData ? (
            <div className="space-y-3">
              <ProgressItem label="Prescriptions Generated" value={progressData.prescriptionsGenerated} />
              <ProgressItem label="Amount Value Sold" value={`₹${progressData.amountValueSold}`} />
              <ProgressItem label="Profit Today" value={`₹${progressData.profitToday}`} />
              <ProgressItem label="Bills in Cash" value={progressData.billsInCash} />
              <ProgressItem label="Bills in UPI" value={progressData.billsInUpi} />
              <ProgressItem label="Repeated Customers" value={progressData.repeatedCustomers} />
              {/* Add more items here */}
            </div>
          ) : (
            <p>Could not load progress data.</p>
          )}
        </CardContent>
        <CardFooter className="text-xs text-gray-500 pt-4">
          Data as of {new Date().toLocaleTimeString()}
        </CardFooter>
      </Card>
  );
};

interface ProgressItemProps {
  label: string;
  value: string | number;
}

const ProgressItem: React.FC<ProgressItemProps> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
    <p className="text-sm text-gray-700">{label}:</p>
    <p className="text-sm font-medium text-gray-900">{value}</p>
  </div>
);

export default TodaysProgressPopoverContent;