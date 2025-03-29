import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { safeQueryData } from "@/utils/safeSupabaseQueries";
import { useToast } from "@/hooks/use-toast";
import { INDIAN_STATES } from "@/constants/states";

export interface LocationAnalyticsData {
  state: string;
  seasonalTrends: {
    season: string;
    topProducts: Array<{name: string, demand: number, trend?: string, source?: string}>;
  }[];
  marketForecasts: Array<{month: string, prediction: number, industryAverage?: number, difference?: number}>;
  regionalDemand: Array<{product: string, demand: number, trend?: string, growth?: number, unit?: string}>;
  dataSources?: string[];
  lastUpdated?: string;
  news?: Array<{title: string, source: string, date: string, summary: string}>;
}

interface PharmacyLocation {
  state: string;
  city: string;
}

export function useLocationBasedAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [locationData, setLocationData] = useState<LocationAnalyticsData | null>(null);
  const [pharmacyLocation, setPharmacyLocation] = useState<PharmacyLocation | null>(null);
  const [error, setError] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [fetchAttempts, setFetchAttempts] = useState(0);
  const { toast } = useToast();
  const maxAttempts = 2; // Maximum number of edge function call attempts

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

  // Fetch location-based analytics from edge function
  const fetchLocationAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // First get the pharmacy location
      const location = await fetchPharmacyLocation();
      const state = location?.state || pharmacyLocation?.state || 'Maharashtra';
      
      console.log("Fetching Google Trends and news data for", state);
      
      // Only try to fetch from edge function if we haven't exceeded max attempts
      if (fetchAttempts < maxAttempts) {
        setFetchAttempts(prev => prev + 1);
        
        try {
          // Set a timeout to prevent hanging on edge function call
          const fetchPromise = supabase.functions.invoke('fetch-trends-data', {
            body: { state, type: 'all' }
          });
          
          // Use a timeout promise to ensure we don't wait too long
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Edge function request timed out")), 5000);
          });
          
          // Race between the fetch and the timeout
          const { data, error } = await Promise.race([
            fetchPromise,
            timeoutPromise.then(() => ({ data: null, error: new Error("Request timed out") }))
          ]) as any;
          
          if (error) {
            throw new Error(`Error fetching trends data: ${error.message}`);
          }
          
          console.log("Received trends data:", data);
          
          // Transform the response into the expected format
          if (data) {
            const analyticsData: LocationAnalyticsData = {
              state,
              seasonalTrends: [],
              marketForecasts: [],
              regionalDemand: [],
              dataSources: data.dataSources || ["Google Trends", "News API"],
              lastUpdated: data.timestamp
            };
            
            // Process trends data
            if (data.trendsData) {
              const season = data.trendsData.season;
              analyticsData.seasonalTrends.push({
                season,
                topProducts: data.trendsData.data || []
              });
              
              // Add other seasons using the fallback mechanism
              const seasons = ["Winter", "Spring", "Summer", "Monsoon"];
              const currentSeason = data.currentSeason;
              
              // For seasons other than the current one, use the fallback generator
              seasons.forEach(s => {
                if (s !== currentSeason) {
                  analyticsData.seasonalTrends.push({
                    season: s,
                    topProducts: generateSeasonalData(state, s)
                  });
                }
              });
            }
            
            // Process market forecast data
            if (data.forecastData && data.forecastData.marketForecast) {
              analyticsData.marketForecasts = data.forecastData.marketForecast;
            }
            
            // Process regional demand data
            if (data.demandData && data.demandData.regionalDemand) {
              analyticsData.regionalDemand = data.demandData.regionalDemand;
            }
            
            // Add news data if available
            if (data.newsData && data.newsData.news) {
              analyticsData.news = data.newsData.news;
            }
            
            setLocationData(analyticsData);
            setLastUpdated(data.timestamp);
            console.log("Location-based analytics:", analyticsData);
            
            toast({
              title: "Location data updated",
              description: `Analytics data for ${state} has been refreshed with Google Trends and News data`,
              duration: 3000
            });
            
            return analyticsData;
          }
        } catch (edgeFunctionError) {
          console.error("Edge function error:", edgeFunctionError);
          // Continue to fallback - don't rethrow
        }
      }
      
      // If the edge function fails or returns no data, use the fallback method
      console.log("Using fallback data generation method");
      return generateFallbackData(state);
    } catch (error) {
      console.error("Error fetching location-based analytics:", error);
      setError(error);
      
      // Use fallback data generation if API fails
      const state = pharmacyLocation?.state || 'Maharashtra';
      const fallbackData = generateFallbackData(state);
      setLocationData(fallbackData);
      
      toast({
        title: "Using offline data",
        description: "External sources are unavailable. Using locally generated analytics.",
        variant: "destructive",
        duration: 5000
      });
      
      return fallbackData;
    } finally {
      setIsLoading(false);
    }
  }, [fetchPharmacyLocation, pharmacyLocation, toast, fetchAttempts]);

  // Fallback data generator if the API call fails
  const generateFallbackData = (state: string): LocationAnalyticsData => {
    return {
      state,
      seasonalTrends: [
        { 
          season: 'Monsoon', 
          topProducts: generateSeasonalData(state, 'Monsoon')
        },
        { 
          season: 'Winter', 
          topProducts: generateSeasonalData(state, 'Winter')
        },
        { 
          season: 'Summer', 
          topProducts: generateSeasonalData(state, 'Summer')
        },
        { 
          season: 'Spring', 
          topProducts: generateSeasonalData(state, 'Spring')
        }
      ],
      marketForecasts: generateMarketForecast(state),
      regionalDemand: generateRegionalDemand(state),
      dataSources: ["Offline Database"],
      lastUpdated: new Date().toISOString()
    };
  };

  // Generate seasonal data based on state (fallback method)
  const generateSeasonalData = (state: string, season: string) => {
    // Map of seasonal trends by region
    const regionalSeasonalData: Record<string, Record<string, any[]>> = {
      'Maharashtra': {
        'Monsoon': [
          { name: 'Anti-malarial drugs', demand: 170, unit: 'packs/week' },
          { name: 'Fever medication', demand: 220, unit: 'packs/week' },
          { name: 'Cold & flu medicine', demand: 185, unit: 'packs/week' },
          { name: 'Electrolyte solutions', demand: 150, unit: 'packs/week' }
        ],
        'Winter': [
          { name: 'Cough syrup', demand: 190, unit: 'packs/week' },
          { name: 'Vitamin C supplements', demand: 160, unit: 'packs/week' },
          { name: 'Inhalers', demand: 140, unit: 'packs/week' },
          { name: 'Antihistamines', demand: 120, unit: 'packs/week' }
        ],
        'Summer': [
          { name: 'Rehydration salts', demand: 210, unit: 'packs/week' },
          { name: 'Sunscreen', demand: 180, unit: 'packs/week' },
          { name: 'Calamine lotion', demand: 130, unit: 'packs/week' },
          { name: 'Anti-diarrheal medication', demand: 160, unit: 'packs/week' }
        ],
        'Spring': [
          { name: 'Allergy medication', demand: 200, unit: 'packs/week' },
          { name: 'Nasal spray', demand: 140, unit: 'packs/week' },
          { name: 'Eye drops', demand: 130, unit: 'packs/week' },
          { name: 'Anti-allergen products', demand: 110, unit: 'packs/week' }
        ]
      },
      'Tamil Nadu': {
        'Monsoon': [
          { name: 'Anti-fungal creams', demand: 190, unit: 'packs/week' },
          { name: 'Fever medication', demand: 230, unit: 'packs/week' },
          { name: 'Electrolyte solutions', demand: 170, unit: 'packs/week' },
          { name: 'Anti-malarial drugs', demand: 150, unit: 'packs/week' }
        ],
        'Summer': [
          { name: 'Rehydration salts', demand: 250, unit: 'packs/week' },
          { name: 'Sunscreen', demand: 200, unit: 'packs/week' },
          { name: 'Heat rash cream', demand: 180, unit: 'packs/week' },
          { name: 'Oral rehydration therapy', demand: 190, unit: 'packs/week' }
        ],
        'Winter': [
          { name: 'Cold & flu medicine', demand: 140, unit: 'packs/week' },
          { name: 'Vitamin supplements', demand: 120, unit: 'packs/week' },
          { name: 'Pain relievers', demand: 110, unit: 'packs/week' },
          { name: 'Throat lozenges', demand: 100, unit: 'packs/week' }
        ],
        'Spring': [
          { name: 'Allergy medication', demand: 160, unit: 'packs/week' },
          { name: 'Nasal spray', demand: 120, unit: 'packs/week' },
          { name: 'Eye drops', demand: 110, unit: 'packs/week' },
          { name: 'Anti-allergen products', demand: 90, unit: 'packs/week' }
        ]
      },
      'Delhi': {
        'Winter': [
          { name: 'Anti-pollution masks', demand: 280, unit: 'packs/week' },
          { name: 'Respiratory medicines', demand: 260, unit: 'packs/week' },
          { name: 'Inhalers', demand: 230, unit: 'packs/week' },
          { name: 'Immunity boosters', demand: 210, unit: 'packs/week' }
        ],
        'Summer': [
          { name: 'Rehydration salts', demand: 240, unit: 'packs/week' },
          { name: 'Heat stroke medication', demand: 200, unit: 'packs/week' },
          { name: 'Sunscreen', demand: 180, unit: 'packs/week' },
          { name: 'Eye drops', demand: 160, unit: 'packs/week' }
        ],
        'Monsoon': [
          { name: 'Anti-malarial drugs', demand: 210, unit: 'packs/week' },
          { name: 'Fever medication', demand: 230, unit: 'packs/week' },
          { name: 'Water purification tablets', demand: 190, unit: 'packs/week' },
          { name: 'Anti-bacterial soaps', demand: 170, unit: 'packs/week' }
        ],
        'Spring': [
          { name: 'Allergy medication', demand: 220, unit: 'packs/week' },
          { name: 'Air purifiers', demand: 180, unit: 'packs/week' },
          { name: 'Eye drops', demand: 150, unit: 'packs/week' },
          { name: 'Anti-allergen products', demand: 130, unit: 'packs/week' }
        ]
      }
    };
    
    // Default data for states not explicitly mapped
    const defaultSeasonalData = {
      'Monsoon': [
        { name: 'Fever medication', demand: 200, unit: 'packs/week' },
        { name: 'Cold & flu medicine', demand: 180, unit: 'packs/week' },
        { name: 'Anti-malarial drugs', demand: 160, unit: 'packs/week' },
        { name: 'Water purification tablets', demand: 140, unit: 'packs/week' }
      ],
      'Winter': [
        { name: 'Cough syrup', demand: 170, unit: 'packs/week' },
        { name: 'Vitamin supplements', demand: 150, unit: 'packs/week' },
        { name: 'Cold & flu medicine', demand: 190, unit: 'packs/week' },
        { name: 'Pain relievers', demand: 130, unit: 'packs/week' }
      ],
      'Summer': [
        { name: 'Rehydration salts', demand: 220, unit: 'packs/week' },
        { name: 'Sunscreen', demand: 190, unit: 'packs/week' },
        { name: 'Heat stroke medication', demand: 170, unit: 'packs/week' },
        { name: 'Anti-diarrheal medication', demand: 150, unit: 'packs/week' }
      ],
      'Spring': [
        { name: 'Allergy medication', demand: 180, unit: 'packs/week' },
        { name: 'Nasal spray', demand: 140, unit: 'packs/week' },
        { name: 'Eye drops', demand: 130, unit: 'packs/week' },
        { name: 'Anti-allergen products', demand: 120, unit: 'packs/week' }
      ]
    };
    
    return regionalSeasonalData[state]?.[season] || defaultSeasonalData[season];
  };

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
        demand: Math.round(item.baseDemand * multiplier * (0.9 + Math.random() * 0.2))
      };
    }).sort((a, b) => b.demand - a.demand);
  }, []);

  // Initialize data on load
  useEffect(() => {
    fetchLocationAnalytics();
    
    // Set up a refresh interval (weekly refresh)
    const refreshInterval = setInterval(fetchLocationAnalytics, 7 * 24 * 60 * 60 * 1000); // 7 days
    
    return () => clearInterval(refreshInterval);
  }, [fetchLocationAnalytics]);

  // Reset fetch attempts counter after a period to allow retrying later
  useEffect(() => {
    if (fetchAttempts >= maxAttempts) {
      const resetTimer = setTimeout(() => {
        setFetchAttempts(0);
      }, 60 * 60 * 1000); // Reset after 1 hour
      
      return () => clearTimeout(resetTimer);
    }
  }, [fetchAttempts]);

  return {
    locationData,
    pharmacyLocation,
    isLoading,
    refreshData: fetchLocationAnalytics,
    error,
    lastUpdated
  };
}
