
import { ReactNode } from "react";

export type DocumentType = 'inventory' | 'sales' | 'purchase_orders' | 'patients';

export interface SystemDocument {
  id: string;
  type: DocumentType;
  name: string;
  icon: ReactNode;
  lastUpdated: Date | null;
  description: string;
  isLoading?: boolean;
}
