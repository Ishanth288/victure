
export const prepareForecastData = (locationData?: any, salesData?: any[]) => {
  if (locationData?.marketForecasts && locationData.marketForecasts.length > 0) {
    return locationData.marketForecasts;
  }
  
  if (!salesData || salesData.length === 0) return [];

  const monthlyData: Record<string, number> = {};
  
  salesData.forEach((bill: any) => {
    if (!bill || !bill.date) return;
    
    try {
      const date = new Date(bill.date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0;
      }
      
      monthlyData[monthYear] += bill.total_amount || 0;
    } catch (error) {
      console.error("Error processing bill data:", error);
    }
  });
  
  // Convert to array for chart
  return Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    prediction: amount
  }));
};

export const prepareMarginData = (inventoryData?: any[]) => {
  if (!inventoryData || inventoryData.length === 0) return [];
  
  // Calculate profit margin for each product
  return inventoryData
    .filter((item: any) => item && item.unit_cost > 0)
    .map((item: any) => {
      // For demo purposes, assuming selling price is 40% markup on cost
      const sellingPrice = item.unit_cost * 1.4;
      const margin = ((sellingPrice - item.unit_cost) / sellingPrice) * 100;
      
      return {
        name: item.name || 'Unknown Product',
        margin: Math.round(margin * 10) / 10,
        cost: item.unit_cost
      };
    })
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 10);
};

export const prepareSupplierData = (suppliersData?: any[]) => {
  if (!suppliersData || suppliersData.length === 0) return [];
  
  const supplierPerformance: Record<string, {orders: number, onTime: number, total: number}> = {};
  
  suppliersData.forEach((order: any) => {
    if (!order) return;
    
    const supplierName = order.supplier_name || 'Unknown Supplier';
    
    if (!supplierPerformance[supplierName]) {
      supplierPerformance[supplierName] = {
        orders: 0,
        onTime: 0,
        total: 0
      };
    }
    
    supplierPerformance[supplierName].orders += 1;
    supplierPerformance[supplierName].total += order.total_amount || 0;
    
    // Assuming on-time delivery if status is 'completed'
    if (order.status === 'completed') {
      supplierPerformance[supplierName].onTime += 1;
    }
  });
  
  // Convert to array for chart
  return Object.entries(supplierPerformance).map(([name, data]) => ({
    name,
    performance: data.orders > 0 ? (data.onTime / data.orders) * 100 : 0,
    orders: data.orders,
    total: data.total
  }));
};

export const prepareExpiryData = (inventoryData?: any[]) => {
  if (!inventoryData || inventoryData.length === 0) return [];
  
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(today.getDate() + 90);
  
  let expiringSoon = 0;
  let expiringLater = 0;
  let expired = 0;
  
  inventoryData.forEach((item: any) => {
    if (!item || !item.expiry_date) return;
    
    try {
      const expiryDate = new Date(item.expiry_date);
      const quantity = item.quantity || 0;
      
      if (expiryDate < today) {
        expired += quantity;
      } else if (expiryDate <= thirtyDaysFromNow) {
        expiringSoon += quantity;
      } else if (expiryDate <= ninetyDaysFromNow) {
        expiringLater += quantity;
      }
    } catch (error) {
      console.error("Error processing expiry date:", error);
    }
  });
  
  return [
    { name: 'Expired', value: expired },
    { name: 'Expiring < 30 days', value: expiringSoon },
    { name: 'Expiring < 90 days', value: expiringLater }
  ].filter(item => item.value > 0);
};

export const prepareSeasonalTrendsData = (locationData?: any) => {
  if (!locationData || !locationData.seasonalTrends) return [];
  
  if (locationData.seasonalTrends && locationData.seasonalTrends.length > 0) {
    // First get the current season
    const now = new Date();
    const month = now.getMonth();
    
    // Determine season (simplistic approach)
    let currentSeason;
    if (month >= 5 && month <= 8) { // Jun-Sep
      currentSeason = "Monsoon";
    } else if (month >= 2 && month <= 4) { // Mar-May
      currentSeason = "Summer";
    } else { // Oct-Feb
      currentSeason = "Winter";
    }
    
    // Find the closest matching season
    const seasonData = locationData.seasonalTrends.find((s: any) => 
      s && s.season && s.season.toLowerCase().includes(currentSeason.toLowerCase())
    ) || locationData.seasonalTrends[0];
    
    return seasonData && seasonData.topProducts ? seasonData.topProducts : [];
  }
  
  return [];
};

export const prepareRegionalDemandData = (locationData?: any) => {
  if (!locationData) return [];
  
  if (locationData.regionalDemand && locationData.regionalDemand.length > 0) {
    return locationData.regionalDemand;
  }
  return [];
};
