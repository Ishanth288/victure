
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkSupabaseConnection } from "@/utils/supabaseErrorHandling";
import { safeQueryData } from "@/utils/safeSupabaseQueries";

interface AdminStats {
  totalRevenue: number;
  inventoryValue: number;
  totalPatients: number;
  lowStockItems: number;
}

export function useAdminStats() {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats>({
    totalRevenue: 0,
    inventoryValue: 0,
    totalPatients: 0,
    lowStockItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminStats = async () => {
    setIsLoading(true);
    try {
      // Ensure Supabase connection is alive
      await checkSupabaseConnection();
      
      // Fetch Total Revenue
      const salesData = await safeQueryData(
        supabase.from('sales').select('total_amount'),
        []
      );
      const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total_amount, 0);

      // Fetch Inventory Value and Low Stock Items
      const inventoryData = await safeQueryData(
        supabase.from('inventory').select('price, quantity'),
        []
      );
      const inventoryValue = inventoryData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const lowStockItems = inventoryData.filter(item => item.quantity < 10).length;

      // Fetch Total Patients
      const patientResult = await safeQueryData(
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        { data: [], count: 0 }
      );

      const totalPatients = patientResult.count || 0;

      setStats({
        totalRevenue,
        inventoryValue,
        totalPatients,
        lowStockItems,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      toast({
        title: "Error",
        description: "Failed to load administrative data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  return { stats, isLoading, refreshStats: fetchAdminStats };
}
