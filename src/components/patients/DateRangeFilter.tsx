
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onFilterApply: () => void;
  isFilterActive: boolean;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onFilterApply,
  isFilterActive,
}: DateRangeFilterProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-2xl">Patients</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Date Range:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-40"
            />
            <span>to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-40"
            />
          </div>
          <Button 
            variant={isFilterActive ? "default" : "outline"}
            onClick={onFilterApply}
            className="ml-2"
          >
            {isFilterActive ? "Clear Filters" : "Apply Filters"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
