
import { Package, BarChart2, FileBarChart, Users } from "lucide-react";
import { SystemDocument } from "./types";

export const initialDocuments: SystemDocument[] = [
  { 
    id: 'inventory', 
    type: 'inventory', 
    name: 'Inventory Report', 
    icon: <Package className="h-5 w-5 text-blue-500" />,
    lastUpdated: null,
    description: 'Complete inventory status with stock levels and values'
  },
  {
    id: 'sales_analysis',
    name: 'Sales Analysis',
    description: 'Detailed analysis of sales data, including product performance and revenue trends.',
    icon: 'LineChart',
    lastUpdated: new Date('2023-10-26T10:00:00Z'),
    isNew: false,
    isUpdated: false,
    isLoading: false,
  },
  { 
    id: 'purchase_orders', 
    type: 'purchase_orders', 
    name: 'Purchase Orders', 
    icon: <FileBarChart className="h-5 w-5 text-orange-500" />,
    lastUpdated: null,
    description: 'Summary of all supplier purchase orders and delivery status'
  },
  { 
    id: 'patients', 
    type: 'patients', 
    name: 'Patient Registry', 
    icon: <Users className="h-5 w-5 text-purple-500" />,
    lastUpdated: null,
    description: 'Complete patient database with contact information'
  }
];
