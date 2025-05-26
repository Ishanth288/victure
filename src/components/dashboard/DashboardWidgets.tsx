
import { TaskManagement } from "@/components/TaskManagement";
import { DocumentManagement } from "@/components/document-management";

export function DashboardWidgets() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <div className="h-full rounded-xl border shadow-sm bg-card p-4">
        <TaskManagement />
      </div>
      <div className="h-full rounded-xl border shadow-sm bg-card p-4">
        <DocumentManagement />
      </div>
    </div>
  );
}
