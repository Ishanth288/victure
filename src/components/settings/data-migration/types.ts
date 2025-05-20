
import { WarningType, PreviewItem, MigrationLog } from "@/types/dataMigration";

export interface FileUploadProps {
  setSelectedFile: (file: File | null) => void;
  setUploadError: (error: string | null) => void;
}

export interface DataPreviewProps {
  previewItems: PreviewItem[];
  selectedFields: Record<string, string>;
  setSelectedFields: (fields: Record<string, string>) => void;
  fileHeaders: string[];
  migrationMode: MigrationMode;
}

export interface ImportControlsProps {
  onStartImport: () => void;
  previewItems: PreviewItem[];
  isImporting: boolean;
  selectedFields: Record<string, string>;
  migrationMode: MigrationMode;
}

export interface MigrationHistoryProps {
  recentMigrations: MigrationLog[];
  onRollback: (migrationId: string, type: 'Inventory' | 'Patients' | 'Prescriptions') => void;
  isRollingBack: boolean;
}

export interface ResultSummaryProps {
  importResults: {
    success: boolean;
    added: number;
    skipped: number;
    issues: Array<{ row: number; reason: string }>;
  } | null;
}

export type MigrationMode = 'Inventory' | 'Patients' | 'Prescriptions';
