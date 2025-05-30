
import { useToast } from "@/hooks/use-toast";
import { useRevenueData } from './hooks/useRevenueData';
import { useInventoryData } from './hooks/useInventoryData';
import { usePatientData } from './hooks/usePatientData';

export function useDashboardData() {
  const { toast } = useToast();
  
  const {
    isLoading: isRevenueLoading,
    totalRevenue,
    revenueData,
    revenueDistribution,
    refresh: refreshRevenue
  } = useRevenueData();

  const {
    isLoading: isInventoryLoading,
    totalInventoryValue,
    lowStockItems,
    refresh: refreshInventory
  } = useInventoryData();

  const {
    isLoading: isPatientLoading,
    totalPatients,
    refresh: refreshPatients
  } = usePatientData();
  
  // Combine loading states
  const isLoading = isRevenueLoading || isInventoryLoading || isPatientLoading;

  const refreshAllDashboardData = () => {
    refreshRevenue();
    refreshInventory();
    refreshPatients();
  };

  return {
    isLoading,
    totalRevenue,
    totalInventoryValue,
    totalPatients,
    lowStockItems,
    revenueData,
    revenueDistribution,
    refreshAllDashboardData
  };
}
