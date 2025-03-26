
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { InventoryItem } from "@/types/inventory";
import { useToast } from "@/hooks/use-toast";

export function useInventoryData() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [userPlan, setUserPlan] = useState<string>("Free Trial");
  const [inventoryLimit, setInventoryLimit] = useState<number>(501);

  useEffect(() => {
    checkAuth();
    fetchInventoryData();
    fetchUserPlan();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please login to view inventory",
        variant: "destructive",
      });
      navigate("/auth");
    }
  };

  const fetchUserPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("plan_type")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setUserPlan(data.plan_type);
        
        // Set inventory limit based on plan
        if (data.plan_type === "PRO") {
          setInventoryLimit(4001);
        } else if (data.plan_type === "PRO PLUS") {
          setInventoryLimit(10000);
        } else {
          setInventoryLimit(501); // Free Trial
        }
      }
    } catch (error) {
      console.error("Error fetching user plan:", error);
    }
  };

  const fetchInventoryData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Filter inventory by user_id to ensure data isolation
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;

      setInventory(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setLoading(false);
    }
  };

  return {
    loading,
    inventory,
    setInventory,
    userPlan,
    inventoryLimit,
    fetchInventoryData
  };
}
