
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { safeQueryData } from "@/utils/safeSupabaseQueries";
import { useToast } from "@/hooks/use-toast";
import { INDIAN_STATES } from "@/constants/states";

export interface LocationAnalyticsData {
  state: string;
  seasonalTrends: {
    season: string;
    topProducts: Array<{name: string, demand: number}>;
  }[];
  marketForecasts: Array<{month: string, prediction: number}>;
  regionalDemand: Array<{product: string, demand: number}>;
}

interface PharmacyLocation {
  state: string;
  city: string;
}

export function useLocationBasedAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [locationData, setLocationData] = useState<LocationAnalyticsData | null>(null);
  const [pharmacyLocation, setPharmacyLocation] = useState<PharmacyLocation | null>(null);
  const { toast } = useToast();

  // Fetch pharmacy location from profile
  const fetchPharmacyLocation = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('state, city')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        console.log("Pharmacy location:", profile);
        setPharmacyLocation({
          state: profile.state || 'Maharashtra', // Default fallback
          city: profile.city || 'Mumbai' // Default fallback
        });
        return profile;
      }
      return null;
    } catch (error) {
      console.error("Error fetching pharmacy location:", error);
      return null;
    }
  }, []);

  // Generate seasonal data based on state
  const generateSeasonalData = useCallback((state: string) => {
    // Map of seasonal trends by region
    const regionalSeasonalData: Record<string, any> = {
      'Maharashtra': [
        { 
          season: 'Monsoon (Jun-Sep)', 
          topProducts: [
            { name: 'Anti-malarial drugs', demand: 170 },
            { name: 'Fever medication', demand: 220 },
            { name: 'Cold & flu medicine', demand: 185 },
            { name: 'Electrolyte solutions', demand: 150 }
          ] 
        },
        { 
          season: 'Winter (Nov-Feb)', 
          topProducts: [
            { name: 'Cough syrup', demand: 190 },
            { name: 'Vitamin C supplements', demand: 160 },
            { name: 'Inhalers', demand: 140 },
            { name: 'Antihistamines', demand: 120 }
          ] 
        },
        { 
          season: 'Summer (Mar-May)', 
          topProducts: [
            { name: 'Rehydration salts', demand: 210 },
            { name: 'Sunscreen', demand: 180 },
            { name: 'Calamine lotion', demand: 130 },
            { name: 'Anti-diarrheal medication', demand: 160 }
          ] 
        }
      ],
      'Tamil Nadu': [
        { 
          season: 'Monsoon (Oct-Dec)', 
          topProducts: [
            { name: 'Anti-fungal creams', demand: 190 },
            { name: 'Fever medication', demand: 230 },
            { name: 'Electrolyte solutions', demand: 170 },
            { name: 'Anti-malarial drugs', demand: 150 }
          ] 
        },
        { 
          season: 'Summer (Mar-Jun)', 
          topProducts: [
            { name: 'Rehydration salts', demand: 250 },
            { name: 'Sunscreen', demand: 200 },
            { name: 'Heat rash cream', demand: 180 },
            { name: 'Oral rehydration therapy', demand: 190 }
          ] 
        },
        { 
          season: 'Winter (Jan-Feb)', 
          topProducts: [
            { name: 'Cold & flu medicine', demand: 140 },
            { name: 'Vitamin supplements', demand: 120 },
            { name: 'Pain relievers', demand: 110 },
            { name: 'Throat lozenges', demand: 100 }
          ] 
        }
      ],
      'Delhi': [
        { 
          season: 'Winter (Nov-Feb)', 
          topProducts: [
            { name: 'Anti-pollution masks', demand: 280 },
            { name: 'Respiratory medicines', demand: 260 },
            { name: 'Inhalers', demand: 230 },
            { name: 'Immunity boosters', demand: 210 }
          ] 
        },
        { 
          season: 'Summer (Apr-Jun)', 
          topProducts: [
            { name: 'Rehydration salts', demand: 240 },
            { name: 'Heat stroke medication', demand: 200 },
            { name: 'Sunscreen', demand: 180 },
            { name: 'Eye drops', demand: 160 }
          ] 
        },
        { 
          season: 'Monsoon (Jul-Sep)', 
          topProducts: [
            { name: 'Anti-malarial drugs', demand: 210 },
            { name: 'Fever medication', demand: 230 },
            { name: 'Water purification tablets', demand: 190 },
            { name: 'Anti-bacterial soaps', demand: 170 }
          ] 
        }
      ]
    };
    
    // Default data for states not explicitly mapped
    const defaultSeasonalData = [
      { 
        season: 'Monsoon', 
        topProducts: [
          { name: 'Fever medication', demand: 200 },
          { name: 'Cold & flu medicine', demand: 180 },
          { name: 'Anti-malarial drugs', demand: 160 },
          { name: 'Water purification tablets', demand: 140 }
        ] 
      },
      { 
        season: 'Winter', 
        topProducts: [
          { name: 'Cough syrup', demand: 170 },
          { name: 'Vitamin supplements', demand: 150 },
          { name: 'Cold & flu medicine', demand: 190 },
          { name: 'Pain relievers', demand: 130 }
        ] 
      },
      { 
        season: 'Summer', 
        topProducts: [
          { name: 'Rehydration salts', demand: 220 },
          { name: 'Sunscreen', demand: 190 },
          { name: 'Heat stroke medication', demand: 170 },
          { name: 'Anti-diarrheal medication', demand: 150 }
        ] 
      }
    ];
    
    return regionalSeasonalData[state] || defaultSeasonalData;
  }, []);

  // Generate market forecast data based on state
  const generateMarketForecast = useCallback((state: string) => {
    // Base forecast with variations by state
    const baseMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const baseForecast = [12000, 13000, 14500, 15000, 14000, 16000, 17500, 18000, 17000, 16500, 18000, 20000];
    
    // State-specific multipliers
    const stateMultipliers: Record<string, number> = {
      'Maharashtra': 1.2,
      'Delhi': 1.4,
      'Tamil Nadu': 1.1,
      'Karnataka': 1.15,
      'Gujarat': 1.25,
      'West Bengal': 1.05,
      'Telangana': 1.1,
      'Andhra Pradesh': 1.05,
      'Kerala': 1.1,
      'Punjab': 1.0
    };
    
    // State-specific seasonal variations (percentage adjustments by month)
    const stateSeasonality: Record<string, number[]> = {
      'Maharashtra': [0, 0, 5, 10, 15, 5, -10, -15, -5, 0, 5, 10],
      'Delhi': [10, 5, 0, -5, -10, -15, -5, 0, 5, 10, 15, 10],
      'Tamil Nadu': [-5, 0, 5, 10, 15, 10, 5, 0, -5, -10, -5, 0],
      'Karnataka': [0, 5, 10, 5, 0, -5, -10, -5, 0, 5, 10, 5]
    };
    
    // Use state-specific data or defaults
    const multiplier = stateMultipliers[state] || 1.0;
    const seasonality = stateSeasonality[state] || Array(12).fill(0);
    
    // Calculate forecast with multiplier and seasonality
    return baseMonths.map((month, i) => {
      const baseValue = baseForecast[i] * multiplier;
      const seasonalAdjustment = baseValue * (seasonality[i] / 100);
      return {
        month,
        prediction: Math.round(baseValue + seasonalAdjustment)
      };
    });
  }, []);

  // Generate regional demand data
  const generateRegionalDemand = useCallback((state: string) => {
    // Common medicines across regions with varying demand
    const baseProducts = [
      { product: 'Paracetamol', baseDemand: 100 },
      { product: 'Antibiotics', baseDemand: 80 },
      { product: 'Antacids', baseDemand: 70 },
      { product: 'Vitamins', baseDemand: 90 },
      { product: 'Diabetes medication', baseDemand: 60 },
      { product: 'Blood pressure medication', baseDemand: 75 },
      { product: 'Dermatological creams', baseDemand: 65 },
      { product: 'Pain relievers', baseDemand: 85 }
    ];
    
    // Region-specific multipliers
    const regionMultipliers: Record<string, Record<string, number>> = {
      'Maharashtra': { 
        'Paracetamol': 1.2, 
        'Antibiotics': 1.3, 
        'Antacids': 1.1, 
        'Vitamins': 1.3,
        'Diabetes medication': 1.4,
        'Blood pressure medication': 1.3,
        'Dermatological creams': 1.1,
        'Pain relievers': 1.2
      },
      'Tamil Nadu': { 
        'Paracetamol': 1.1, 
        'Antibiotics': 1.2, 
        'Antacids': 1.3, 
        'Vitamins': 1.1,
        'Diabetes medication': 1.5,
        'Blood pressure medication': 1.4,
        'Dermatological creams': 1.2,
        'Pain relievers': 1.1
      },
      'Delhi': { 
        'Paracetamol': 1.3, 
        'Antibiotics': 1.4, 
        'Antacids': 1.2, 
        'Vitamins': 1.5,
        'Diabetes medication': 1.3,
        'Blood pressure medication': 1.5,
        'Dermatological creams': 1.3,
        'Pain relievers': 1.4
      }
    };
    
    // Default multiplier for states not explicitly listed
    const defaultMultiplier = 1.0;
    
    // Apply region-specific multipliers or default
    return baseProducts.map(item => {
      const stateMultipliers = regionMultipliers[state];
      const multiplier = stateMultipliers ? 
        (stateMultipliers[item.product] || defaultMultiplier) : 
        defaultMultiplier;
      
      return {
        product: item.product,
        demand: Math.round(item.baseDemand * multiplier * (0.9 + Math.random() * 0.2)) // Add some randomness
      };
    }).sort((a, b) => b.demand - a.demand); // Sort by demand (highest first)
  }, []);

  // Fetch location-based analytics
  const fetchLocationAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      // First get the pharmacy location
      const location = await fetchPharmacyLocation();
      const state = location?.state || pharmacyLocation?.state || 'Maharashtra';
      
      // Generate data based on location
      const seasonalTrends = generateSeasonalData(state);
      const marketForecasts = generateMarketForecast(state);
      const regionalDemand = generateRegionalDemand(state);
      
      const analyticsData: LocationAnalyticsData = {
        state,
        seasonalTrends,
        marketForecasts,
        regionalDemand
      };
      
      setLocationData(analyticsData);
      console.log("Location-based analytics:", analyticsData);
      
      toast({
        title: "Location data updated",
        description: `Analytics data for ${state} has been refreshed`,
        duration: 3000
      });
      
      return analyticsData;
    } catch (error) {
      console.error("Error fetching location-based analytics:", error);
      toast({
        title: "Error updating location data",
        description: "There was a problem retrieving location-specific analytics",
        variant: "destructive",
        duration: 5000
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchPharmacyLocation, generateSeasonalData, generateMarketForecast, generateRegionalDemand, pharmacyLocation, toast]);

  // Initialize data on load
  useEffect(() => {
    fetchLocationAnalytics();
    
    // Set up a refresh interval (every 5 minutes)
    const refreshInterval = setInterval(fetchLocationAnalytics, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchLocationAnalytics]);

  return {
    locationData,
    pharmacyLocation,
    isLoading,
    refreshData: fetchLocationAnalytics
  };
}
