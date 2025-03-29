
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Helper function for structured logging
const logInfo = (message: string, data?: any) => {
  console.log(`[trends-data] ${message}`, data ? JSON.stringify(data) : "");
};

// The main function handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request data
    const { state, type = "all" } = await req.json();
    
    if (!state) {
      throw new Error("State parameter is required");
    }

    logInfo("Fetching trends data for state", { state, type });
    
    // Get current season based on month
    const getCurrentSeason = () => {
      const month = new Date().getMonth();
      if (month >= 2 && month <= 4) return "Spring"; // March-May
      if (month >= 5 && month <= 7) return "Summer"; // June-August
      if (month >= 8 && month <= 10) return "Fall"; // September-November
      return "Winter"; // December-February
    };

    const currentSeason = getCurrentSeason();
    logInfo("Current season determined", { currentSeason });
    
    // Fetch Google Trends data (simulated since actual API needs authentication)
    // In production, you would use the official Google Trends API
    const fetchTrendsData = async (state: string, season: string) => {
      logInfo("Would fetch real Google Trends data here", { state, season });
      
      // This is where you'd connect to the actual Google Trends API
      // For demo purposes, we'll return enhanced but still simulated data
      // based on the state and current season
      
      // Map of seasonal health trends by region using simulated Google Trends data
      const trendsMappings: Record<string, any> = {
        'Maharashtra': {
          'Summer': [
            { name: 'Rehydration salts', demand: 210, trend: 'rising', source: 'Google Trends' },
            { name: 'Sunscreen', demand: 180, trend: 'rising', source: 'Google Trends' },
            { name: 'Heat stroke medication', demand: 150, trend: 'stable', source: 'News API' },
            { name: 'Calamine lotion', demand: 130, trend: 'rising', source: 'Google Trends' },
          ],
          'Monsoon': [
            { name: 'Anti-malarial drugs', demand: 170, trend: 'rising', source: 'News API' },
            { name: 'Fever medication', demand: 220, trend: 'rising', source: 'Google Trends' },
            { name: 'Cold & flu medicine', demand: 185, trend: 'stable', source: 'Google Trends' },
            { name: 'Electrolyte solutions', demand: 150, trend: 'rising', source: 'News API' },
          ],
          'Winter': [
            { name: 'Cough syrup', demand: 190, trend: 'rising', source: 'Google Trends' },
            { name: 'Vitamin C supplements', demand: 160, trend: 'rising', source: 'News API' },
            { name: 'Inhalers', demand: 140, trend: 'stable', source: 'Google Trends' },
            { name: 'Antihistamines', demand: 120, trend: 'falling', source: 'Google Trends' },
          ],
          'Spring': [
            { name: 'Allergy medication', demand: 200, trend: 'rising', source: 'Google Trends' },
            { name: 'Eye drops', demand: 140, trend: 'stable', source: 'News API' },
            { name: 'Nasal spray', demand: 130, trend: 'rising', source: 'Google Trends' },
            { name: 'Anti-allergen products', demand: 110, trend: 'rising', source: 'News API' },
          ]
        },
        'Tamil Nadu': {
          'Summer': [
            { name: 'Rehydration salts', demand: 250, trend: 'rising', source: 'Google Trends' },
            { name: 'Sunscreen', demand: 200, trend: 'rising', source: 'Google Trends' },
            { name: 'Heat rash cream', demand: 180, trend: 'stable', source: 'News API' },
            { name: 'Oral rehydration therapy', demand: 190, trend: 'rising', source: 'Google Trends' },
          ],
          'Monsoon': [
            { name: 'Anti-fungal creams', demand: 190, trend: 'rising', source: 'News API' },
            { name: 'Fever medication', demand: 230, trend: 'rising', source: 'Google Trends' },
            { name: 'Electrolyte solutions', demand: 170, trend: 'stable', source: 'Google Trends' },
            { name: 'Anti-malarial drugs', demand: 150, trend: 'rising', source: 'News API' },
          ],
          'Winter': [
            { name: 'Cold & flu medicine', demand: 140, trend: 'rising', source: 'Google Trends' },
            { name: 'Vitamin supplements', demand: 120, trend: 'rising', source: 'News API' },
            { name: 'Pain relievers', demand: 110, trend: 'stable', source: 'Google Trends' },
            { name: 'Throat lozenges', demand: 100, trend: 'falling', source: 'Google Trends' },
          ],
          'Spring': [
            { name: 'Allergy medication', demand: 160, trend: 'rising', source: 'Google Trends' },
            { name: 'Nasal spray', demand: 120, trend: 'stable', source: 'News API' },
            { name: 'Eye drops', demand: 110, trend: 'rising', source: 'Google Trends' },
            { name: 'Anti-allergen products', demand: 90, trend: 'rising', source: 'News API' },
          ]
        },
        'Delhi': {
          'Summer': [
            { name: 'Rehydration salts', demand: 240, trend: 'rising', source: 'Google Trends' },
            { name: 'Heat stroke medication', demand: 200, trend: 'rising', source: 'Google Trends' },
            { name: 'Sunscreen', demand: 180, trend: 'stable', source: 'News API' },
            { name: 'Eye drops', demand: 160, trend: 'rising', source: 'Google Trends' },
          ],
          'Monsoon': [
            { name: 'Anti-malarial drugs', demand: 210, trend: 'rising', source: 'News API' },
            { name: 'Fever medication', demand: 230, trend: 'rising', source: 'Google Trends' },
            { name: 'Water purification tablets', demand: 190, trend: 'stable', source: 'Google Trends' },
            { name: 'Anti-bacterial soaps', demand: 170, trend: 'rising', source: 'News API' },
          ],
          'Winter': [
            { name: 'Anti-pollution masks', demand: 280, trend: 'rising', source: 'Google Trends' },
            { name: 'Respiratory medicines', demand: 260, trend: 'rising', source: 'News API' },
            { name: 'Inhalers', demand: 230, trend: 'stable', source: 'Google Trends' },
            { name: 'Immunity boosters', demand: 210, trend: 'rising', source: 'News API' },
          ],
          'Spring': [
            { name: 'Allergy medication', demand: 220, trend: 'rising', source: 'Google Trends' },
            { name: 'Air purifiers', demand: 180, trend: 'stable', source: 'News API' },
            { name: 'Eye drops', demand: 150, trend: 'rising', source: 'Google Trends' },
            { name: 'Anti-allergen products', demand: 130, trend: 'rising', source: 'News API' },
          ]
        }
      };
      
      // Default data for states not explicitly mapped
      const defaultSeasonalData = {
        'Summer': [
          { name: 'Rehydration salts', demand: 220, trend: 'rising', source: 'Google Trends' },
          { name: 'Sunscreen', demand: 190, trend: 'rising', source: 'Google Trends' },
          { name: 'Heat stroke medication', demand: 170, trend: 'stable', source: 'News API' },
          { name: 'Anti-diarrheal medication', demand: 150, trend: 'stable', source: 'Google Trends' },
        ],
        'Monsoon': [
          { name: 'Fever medication', demand: 200, trend: 'rising', source: 'Google Trends' },
          { name: 'Cold & flu medicine', demand: 180, trend: 'stable', source: 'News API' },
          { name: 'Anti-malarial drugs', demand: 160, trend: 'rising', source: 'Google Trends' },
          { name: 'Water purification tablets', demand: 140, trend: 'stable', source: 'News API' },
        ],
        'Winter': [
          { name: 'Cough syrup', demand: 170, trend: 'rising', source: 'Google Trends' },
          { name: 'Vitamin supplements', demand: 150, trend: 'stable', source: 'News API' },
          { name: 'Cold & flu medicine', demand: 190, trend: 'rising', source: 'Google Trends' },
          { name: 'Pain relievers', demand: 130, trend: 'stable', source: 'Google Trends' },
        ],
        'Spring': [
          { name: 'Allergy medication', demand: 180, trend: 'rising', source: 'Google Trends' },
          { name: 'Nasal spray', demand: 140, trend: 'stable', source: 'News API' },
          { name: 'Eye drops', demand: 130, trend: 'rising', source: 'Google Trends' },
          { name: 'Anti-allergen products', demand: 120, trend: 'stable', source: 'News API' },
        ]
      };
      
      const stateData = trendsMappings[state];
      const seasonData = stateData ? stateData[season] : defaultSeasonalData[season];
      
      return {
        state,
        season,
        data: seasonData || defaultSeasonalData[season],
        lastUpdated: new Date().toISOString(),
        source: "Google Trends and News API"
      };
    };

    // Fetch news data (simulated since News API needs API key)
    const fetchNewsData = async (state: string, season: string) => {
      logInfo("Would fetch real News API data here", { state, season });
      
      // This would use the actual News API in production
      // For now, return simulated news data relevant to pharmacy trends
      
      const currentMonth = new Date().getMonth();
      
      // Seasonal health news by region
      const newsMapping: Record<string, any> = {
        'Maharashtra': [
          {
            title: "Seasonal Allergies on the Rise in Maharashtra",
            source: "Health News Today",
            date: new Date().toISOString(),
            summary: "Pollen counts are higher than usual this season, leading to increased demand for antihistamines."
          },
          {
            title: "Health Department Issues Heat Advisory",
            source: "Mumbai Medical Journal",
            date: new Date().toISOString(),
            summary: "With temperatures rising, healthcare facilities are stocking up on rehydration products."
          }
        ],
        'Tamil Nadu': [
          {
            title: "Dengue Prevention Measures Implemented in Tamil Nadu",
            source: "Chennai Health Report",
            date: new Date().toISOString(),
            summary: "Local authorities are recommending increased stocks of fever medications and mosquito repellents."
          },
          {
            title: "Respiratory Issues Rise Due to Changing Weather",
            source: "South India Medical News",
            date: new Date().toISOString(),
            summary: "Doctors suggest pharmacies prepare for increased demand for respiratory medications."
          }
        ],
        'Delhi': [
          {
            title: "Air Quality Alert Issued for Delhi Region",
            source: "Delhi Health Network",
            date: new Date().toISOString(),
            summary: "Poor air quality is driving demand for respiratory medications and anti-pollution masks."
          },
          {
            title: "Seasonal Flu Cases Spike in Northern India",
            source: "Indian Medical Times",
            date: new Date().toISOString(),
            summary: "Influenza cases up 30% compared to last year. Pharmacies advised to stock flu medications."
          }
        ]
      };
      
      // Default news for states not explicitly mapped
      const defaultNews = [
        {
          title: "Seasonal Health Trends: What Pharmacies Should Stock",
          source: "Pharmacy Today",
          date: new Date().toISOString(),
          summary: "Industry experts recommend adjusting inventory based on seasonal health patterns."
        },
        {
          title: "Health Ministry Issues Seasonal Preparedness Guidelines",
          source: "National Health Portal",
          date: new Date().toISOString(),
          summary: "New guidelines published for pharmacies to prepare for seasonal health challenges."
        }
      ];
      
      return {
        state,
        news: newsMapping[state] || defaultNews,
        lastUpdated: new Date().toISOString(),
        source: "Health News API"
      };
    };

    // Fetch regional demand data enhanced with market intelligence
    const fetchRegionalDemandData = async (state: string) => {
      logInfo("Fetching regional demand data", { state });
      
      // This would use actual market intelligence APIs in production
      // For now, provide enhanced simulated data
      
      // Base products with realistic demand metrics
      const baseProducts = [
        { product: 'Paracetamol', baseDemand: 100, trend: 'stable', growth: 2.5 },
        { product: 'Antibiotics', baseDemand: 80, trend: 'rising', growth: 3.2 },
        { product: 'Antacids', baseDemand: 70, trend: 'stable', growth: 1.8 },
        { product: 'Vitamins', baseDemand: 90, trend: 'rising', growth: 4.5 },
        { product: 'Diabetes medication', baseDemand: 60, trend: 'rising', growth: 5.7 },
        { product: 'Blood pressure medication', baseDemand: 75, trend: 'stable', growth: 2.1 },
        { product: 'Dermatological creams', baseDemand: 65, trend: 'falling', growth: -1.2 },
        { product: 'Pain relievers', baseDemand: 85, trend: 'stable', growth: 1.5 }
      ];
      
      // Region-specific multipliers based on simulated market intelligence
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
      const regionalDemand = baseProducts.map(item => {
        const stateMultipliers = regionMultipliers[state];
        const multiplier = stateMultipliers ? 
          (stateMultipliers[item.product] || defaultMultiplier) : 
          defaultMultiplier;
        
        return {
          product: item.product,
          demand: Math.round(item.baseDemand * multiplier * (0.9 + Math.random() * 0.2)),
          trend: item.trend,
          growth: item.growth,
          unit: 'packs/week'
        };
      }).sort((a, b) => b.demand - a.demand);
      
      return {
        state,
        regionalDemand,
        lastUpdated: new Date().toISOString(),
        source: "Market Intelligence API"
      };
    };

    // Fetch market forecast data with industry trends
    const fetchMarketForecastData = async (state: string) => {
      logInfo("Fetching market forecast data", { state });
      
      // This would use actual market forecast APIs in production
      // For now, provide enhanced simulated data
      
      // Base forecast with realistic market patterns
      const baseMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const baseForecast = [12000, 13000, 14500, 15000, 14000, 16000, 17500, 18000, 17000, 16500, 18000, 20000];
      
      // Get industry average data (simulated)
      const industryAverage = baseForecast.map(val => Math.round(val * 0.85));
      
      // State-specific multipliers based on market research
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
      const forecast = baseMonths.map((month, i) => {
        const baseValue = baseForecast[i] * multiplier;
        const seasonalAdjustment = baseValue * (seasonality[i] / 100);
        const industryAverageValue = industryAverage[i];
        
        return {
          month,
          prediction: Math.round(baseValue + seasonalAdjustment),
          industryAverage: industryAverageValue,
          difference: Math.round((baseValue + seasonalAdjustment) - industryAverageValue)
        };
      });
      
      return {
        state,
        marketForecast: forecast,
        lastUpdated: new Date().toISOString(),
        source: "Market Intelligence and Industry Reports"
      };
    };

    // Aggregate all data based on request type
    let responseData = {};
    
    if (type === "all" || type === "trends") {
      const trendsData = await fetchTrendsData(state, currentSeason);
      responseData = { ...responseData, trendsData };
    }
    
    if (type === "all" || type === "news") {
      const newsData = await fetchNewsData(state, currentSeason);
      responseData = { ...responseData, newsData };
    }
    
    if (type === "all" || type === "demand") {
      const demandData = await fetchRegionalDemandData(state);
      responseData = { ...responseData, demandData };
    }
    
    if (type === "all" || type === "forecast") {
      const forecastData = await fetchMarketForecastData(state);
      responseData = { ...responseData, forecastData };
    }
    
    // Add metadata to the response
    const enhancedResponse = {
      ...responseData,
      timestamp: new Date().toISOString(),
      requestedState: state,
      currentSeason,
      dataSources: ["Google Trends", "News API", "Market Intelligence"]
    };
    
    logInfo("Successfully prepared response", { state, type });

    return new Response(JSON.stringify(enhancedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in fetch-trends-data function:", error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
