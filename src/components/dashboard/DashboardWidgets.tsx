
import { TaskManagement } from "@/components/TaskManagement";
import { DocumentManagement } from "@/components/document-management";

export function DashboardWidgets() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <TaskManagement />
      <DocumentManagement />
    </div>
  );
}
