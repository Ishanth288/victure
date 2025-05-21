
import { TaskManagement } from "@/components/TaskManagement";
import { DocumentManagement } from "@/components/document-management";

export function DashboardWidgets() {
  return (
    <div className="h-full">
      <div className="mb-6">
        <TaskManagement />
      </div>
      <div>
        <DocumentManagement />
      </div>
    </div>
  );
}
