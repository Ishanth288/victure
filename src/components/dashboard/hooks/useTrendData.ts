
import { useState } from 'react';

export function useTrendData() {
  const [trendData] = useState([
    { name: 'Jan', value: 5000 },
    { name: 'Feb', value: 7000 },
    { name: 'Mar', value: 6000 },
    { name: 'Apr', value: 8000 },
    { name: 'May', value: 9500 },
    { name: 'Jun', value: 11000 },
    { name: 'Jul', value: 10000 },
  ]);

  return { trendData };
}
