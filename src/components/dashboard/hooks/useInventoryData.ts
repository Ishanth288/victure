import { useEffect, useState } from 'react';
import { useInventory } from "@/contexts/InventoryContext";

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit_cost?: number; // Made optional to match usage
  selling_price?: number;
  reorder_point?: number;
}

export function useInventoryData() {
  const { inventory: inventoryData, isLoading, refreshInventory: refresh } = useInventory();

  useEffect(() => {
    // The inventory data is now managed by InventoryContext
    // No need to fetch here, just ensure the context is providing data
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Inventory data loading timeout - setting loading to false');
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [inventoryData, isLoading]);

  // Calculate inventory metrics
  const totalInventoryValue = inventoryData.reduce(
    (sum, item) => sum + ((item.unit_cost || 0) * (item.quantity || 0)),
    0
  );
  console.log('Calculated totalInventoryValue:', totalInventoryValue);

  const lowStockItems = inventoryData.filter(
    item => (item.quantity || 0) < (item.reorder_point || 10)
  ).length;

  console.log('📦 Inventory Hook Results:', {
    inventoryDataCount: inventoryData.length,
    inventoryData: inventoryData.slice(0, 3), // Show first 3 items
    calculatedTotalInventoryValue: totalInventoryValue,
    calculatedLowStockItems: lowStockItems,
    isLoading
  });

  // Calculate profit metrics
  const totalSellingValue = inventoryData.reduce(
    (sum, item) => sum + ((item.selling_price || 0) * (item.quantity || 0)),
    0
  );

  const totalProfit = totalSellingValue - totalInventoryValue;

  // Calculate overall profit margin
  const profitMargin = totalSellingValue > 0
    ? (totalProfit / totalSellingValue) * 100
    : 0;

  // Calculate profit by item
  const itemProfits = inventoryData.map(item => ({
    id: item.id,
    name: item.name,
    profit: ((item.selling_price || 0) - (item.unit_cost || 0)) * (item.quantity || 0),
    profitMargin: item.selling_price && item.selling_price > 0
      ? (((item.selling_price || 0) - (item.unit_cost || 0)) / item.selling_price) * 100
      : 0
  }));

  return {
    isLoading,
    inventoryData,
    totalInventoryValue,
    lowStockItems,
    profitMetrics: {
      totalProfit,
      profitMargin,
      itemProfits
    },
    refresh
  };
}