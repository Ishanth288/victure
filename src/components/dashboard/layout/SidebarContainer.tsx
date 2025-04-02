
import React from "react";
import { SidebarLinks } from "@/components/dashboard/SidebarLinks";
import { cn } from "@/lib/utils";

export function SidebarContainer() {
  return (
    <div className="w-60 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0">
      <div className="flex flex-col h-full p-3">
        <div className="mb-4 flex-1">
          <div className="space-y-2.5">
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Manage your pharmacy with ease.
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarLinks />
        </div>
      </div>
    </div>
  );
}
