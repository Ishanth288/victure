
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeFilterProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-2xl">Patients</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
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
        </div>
      </CardContent>
    </Card>
  );
}
