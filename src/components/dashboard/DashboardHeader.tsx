
import React from "react";
import { UserButton } from "@/components/ui/user-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <NotificationBell />
        <ThemeToggle />
        <UserButton />
      </div>
    </header>
  );
}
