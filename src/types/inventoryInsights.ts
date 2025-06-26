// TypeScript interfaces for Intelligent Inventory Management

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  expiry_date?: string;
  selling_price?: number;
  unit_cost?: number;
}

export interface BillItem {
  inventory_item_id: string;
  quantity: number;
  inventory?: {
    id: string;
    name: string;
    quantity: number;
  };
  bills: {
    date: string;
    user_id: string;
  };
}

export interface PrescriptionDrivenSuggestion {
  id: string;
  name: string;
  suggestion: string;
}

export interface SalesVelocityItem {
  id: string;
  name: string;
  velocity: 'High' | 'Medium' | 'Low';
  trend: 'Increasing' | 'Stable' | 'Decreasing';
}

export interface ExpiryAlert {
  id: string;
  name: string;
  expiryDate: string;
  daysLeft: number;
  action: string;
}

export interface FastMover {
  id: string;
  name: string;
  sales: number;
}

export interface SlowMover {
  id: string;
  name: string;
  sales: number;
  lastSale: string;
}

export interface MoversAnalysis {
  fastMovers: FastMover[];
  slowMovers: SlowMover[];
}

export interface InventoryInsights {
  prescriptionDrivenSuggestions: PrescriptionDrivenSuggestion[];
  salesVelocity: SalesVelocityItem[];
  expiryAlerts: ExpiryAlert[];
  moversAnalysis: MoversAnalysis;
}

export interface ItemFrequencyData {
  count: number;
  name: string;
  currentStock: number;
}

export interface InventoryInsightsError {
  message: string;
  code?: string;
  details?: any;
}