
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
  total_users: number;
  total_products: number;
  feedback_count: number;
  active_users: number;
}

export function useAdminStats() {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats>({
    totalRevenue: 0,
    inventoryValue: 0,
    totalPatients: 0,
    lowStockItems: 0,
    total_users: 0,
    total_products: 0,
    feedback_count: 0,
    active_users: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminStats = async () => {
    setIsLoading(true);
    try {
      // Ensure Supabase connection is alive
      await checkSupabaseConnection();
      
      // Fetch Total Revenue from bills table
      const salesData = await safeQueryData(
        supabase.from('bills').select('total_amount'),
        []
      );
      const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total_amount, 0);

      // Fetch Inventory Value and Low Stock Items
      const inventoryData = await safeQueryData(
        supabase.from('inventory').select('selling_price, quantity'),
        []
      );
      const inventoryValue = inventoryData.reduce((sum, item) => sum + ((item.selling_price || 0) * item.quantity), 0);
      const lowStockItems = inventoryData.filter(item => item.quantity < 10).length;

      // Fetch Total Patients
      const patientResult = await safeQueryData(
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        { data: [], count: 0 }
      );
      const totalPatients = patientResult.count || 0;

      // Fetch Total Users
      const usersResult = await safeQueryData(
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        { data: [], count: 0 }
      );
      const total_users = usersResult.count || 0;

      // Fetch Total Products (inventory items)
      const total_products = inventoryData.length;

      // Fetch Feedback Count
      const feedbackResult = await safeQueryData(
        supabase.from('feedback').select('*', { count: 'exact', head: true }),
        { data: [], count: 0 }
      );
      const feedback_count = feedbackResult.count || 0;

      // Calculate active users (users who have logged in recently)
      const active_users = Math.floor(total_users * 0.7); // Mock calculation

      setStats({
        totalRevenue,
        inventoryValue,
        totalPatients,
        lowStockItems,
        total_users,
        total_products,
        feedback_count,
        active_users,
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
