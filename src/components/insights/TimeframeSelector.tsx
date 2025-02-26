
import { Button } from "@/components/ui/button";

interface TimeframeSelectorProps {
  timeframe: 'day' | 'week' | 'month' | 'year';
  onTimeframeChange: (timeframe: 'day' | 'week' | 'month' | 'year') => void;
}

export function TimeframeSelector({ timeframe, onTimeframeChange }: TimeframeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {['day', 'week', 'month', 'year'].map((period) => (
        <Button
          key={period}
          variant={timeframe === period ? 'default' : 'outline'}
          onClick={() => onTimeframeChange(period as any)}
          className="w-full"
        >
          {period.charAt(0).toUpperCase() + period.slice(1)}
        </Button>
      ))}
    </div>
  );
}
