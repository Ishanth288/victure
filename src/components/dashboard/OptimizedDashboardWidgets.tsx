
import { TaskManagement } from "@/components/TaskManagement";
import { DocumentManagement } from "@/components/document-management";

export function OptimizedDashboardWidgets() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
      <div className="w-full rounded-xl border shadow-sm bg-card p-4 h-[400px]">
        <TaskManagement />
      </div>
      <div className="w-full rounded-xl border shadow-sm bg-card p-4 h-[400px]">
        <DocumentManagement />
      </div>
    </div>
  );
}
