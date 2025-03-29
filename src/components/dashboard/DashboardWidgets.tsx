
import { TaskManagement } from "@/components/TaskManagement";
import { CalendarComponent } from "@/components/CalendarComponent";
import { DocumentManagement } from "@/components/document-management";

export function DashboardWidgets() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <TaskManagement />
      <CalendarComponent />
      <DocumentManagement />
    </div>
  );
}
