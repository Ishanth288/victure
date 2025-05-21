
import { TaskManagement } from "@/components/TaskManagement";
import { DocumentManagement } from "@/components/document-management";
import { InventoryOptimization } from '@/components/ai/InventoryOptimization';

export function DashboardWidgets() {
  return (
    <>
      <div className="h-full rounded-xl border shadow-sm bg-card p-4">
        <TaskManagement />
      </div>
      <div className="h-full rounded-xl border shadow-sm bg-card p-4">
        <DocumentManagement />
      </div>
      <div className="h-full rounded-xl border shadow-sm bg-card p-4">
        <InventoryOptimization />
      </div>
    </>
  );
}
