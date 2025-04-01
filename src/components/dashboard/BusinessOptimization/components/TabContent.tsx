
import { ReactNode } from "react";

export interface TabContentProps {
  children: ReactNode;
}

export function TabContent({ children }: TabContentProps) {
  return (
    <div className="py-4">
      {children}
    </div>
  );
}
