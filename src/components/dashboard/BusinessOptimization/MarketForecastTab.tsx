
import React from "react";

// Define props interface for the component
export interface MarketForecastTabProps {
  forecastData: any[];
  regionalDemandData: any[];
  seasonalTrendsData: any[];
  pharmacyLocation: any;
}

export const MarketForecastTab: React.FC<MarketForecastTabProps> = ({
  forecastData,
  regionalDemandData,
  seasonalTrendsData,
  pharmacyLocation
}) => {
  return (
    <div>
      <h2>Market Forecast</h2>
      <p>This feature is coming soon!</p>
    </div>
  );
};
