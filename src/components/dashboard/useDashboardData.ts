
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
    revenueDistribution 
  } = useRevenueData();
  
  const { 
    isLoading: isInventoryLoading, 
    totalInventoryValue, 
    lowStockItems 
  } = useInventoryData();
  
  const { 
    isLoading: isPatientLoading, 
    totalPatients 
  } = usePatientData();
  
  // Combine loading states
  const isLoading = isRevenueLoading || isInventoryLoading || isPatientLoading;

  return {
    isLoading,
    totalRevenue,
    totalInventoryValue,
    totalPatients,
    lowStockItems,
    revenueData,
    revenueDistribution
  };
}
