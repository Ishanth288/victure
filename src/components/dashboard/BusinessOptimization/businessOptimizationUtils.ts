
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
  const data = Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    prediction: amount
  }));
  
  // If we don't have enough data, generate some forecasts for future months
  if (data.length < 6) {
    const lastAmount = data.length > 0 ? data[data.length - 1].prediction : 10000;
    const now = new Date();
    
    // Add future months
    for (let i = 1; i <= 6 - data.length; i++) {
      const futureMonth = now.getMonth() + i;
      const futureYear = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
      const adjustedMonth = (futureMonth % 12) + 1;
      
      // Add some randomness and a slight upward trend to the forecast
      const randomFactor = 0.9 + (Math.random() * 0.4); // 0.9 to 1.3
      const trendFactor = 1 + (i * 0.03); // Small increase each month
      const forecastAmount = lastAmount * randomFactor * trendFactor;
      
      data.push({
        month: `${adjustedMonth}/${futureYear}`,
        prediction: Math.round(forecastAmount)
      });
    }
  }
  
  return data;
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
  if (locationData?.seasonalTrends && locationData.seasonalTrends.length > 0) {
    // First get the current season
    const now = new Date();
    const month = now.getMonth();
    
    // Determine season (simplistic approach)
    let currentSeason;
    if (month >= 2 && month <= 4) { // Mar-May
      currentSeason = "Spring";
    } else if (month >= 5 && month <= 7) { // Jun-Aug
      currentSeason = "Summer";
    } else if (month >= 8 && month <= 10) { // Sep-Nov
      currentSeason = "Fall";
    } else { // Dec-Feb
      currentSeason = "Winter";
    }
    
    // Find the closest matching season
    const seasonData = locationData.seasonalTrends.find((s: any) => 
      s && s.season && s.season.toLowerCase().includes(currentSeason.toLowerCase())
    ) || locationData.seasonalTrends[0];
    
    if (seasonData && seasonData.topProducts) {
      return seasonData.topProducts.map((product: any) => ({
        ...product,
        unit: 'units' // Adding units for clarity
      }));
    }
  }
  
  // If we don't have real data, generate some based on the current season
  const now = new Date();
  const month = now.getMonth();
  
  // Generate seasonal product data based on current month
  let products: any[] = [];
  
  if (month >= 2 && month <= 4) { // Spring: March-May
    products = [
      { name: "Allergy Relief", demand: 45, unit: "units/week" },
      { name: "Antihistamines", demand: 38, unit: "units/week" },
      { name: "Cold & Flu", demand: 25, unit: "units/week" },
      { name: "Nasal Spray", demand: 20, unit: "units/week" },
      { name: "Vitamin C", demand: 35, unit: "units/week" }
    ];
  } else if (month >= 5 && month <= 7) { // Summer: June-August
    products = [
      { name: "Sunscreen SPF 50", demand: 50, unit: "units/week" },
      { name: "Insect Repellent", demand: 35, unit: "units/week" },
      { name: "Hydration Salts", demand: 30, unit: "units/week" },
      { name: "Calamine Lotion", demand: 25, unit: "units/week" },
      { name: "Travel Medicine Kit", demand: 20, unit: "units/week" }
    ];
  } else if (month >= 8 && month <= 10) { // Fall: September-November
    products = [
      { name: "Immune Boosters", demand: 40, unit: "units/week" },
      { name: "Multivitamins", demand: 45, unit: "units/week" },
      { name: "Cough Syrup", demand: 30, unit: "units/week" },
      { name: "Pain Relievers", demand: 25, unit: "units/week" },
      { name: "Throat Lozenges", demand: 22, unit: "units/week" }
    ];
  } else { // Winter: December-February
    products = [
      { name: "Cold & Flu Medicine", demand: 55, unit: "units/week" },
      { name: "Vitamin D", demand: 40, unit: "units/week" },
      { name: "Cough Suppressant", demand: 38, unit: "units/week" },
      { name: "Fever Reducers", demand: 32, unit: "units/week" },
      { name: "Nasal Decongestant", demand: 30, unit: "units/week" }
    ];
  }
  
  return products;
};

export const prepareRegionalDemandData = (locationData?: any) => {
  if (locationData?.regionalDemand && locationData.regionalDemand.length > 0) {
    return locationData.regionalDemand;
  }
  
  // If we don't have real data, generate some reasonable defaults
  return [
    { product: "Paracetamol", demand: 120 },
    { product: "Antibiotics", demand: 85 },
    { product: "Multivitamins", demand: 95 },
    { product: "Blood Pressure Meds", demand: 70 },
    { product: "Diabetes Supplies", demand: 60 }
  ];
};
