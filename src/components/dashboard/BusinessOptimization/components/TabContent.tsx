import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface TabContentProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function TabContent({ children, title, description }: TabContentProps) {
  // If there's a title, render a card with header and content
  if (title) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    );
  }
  
  // Otherwise, just render the children with simple padding
  return (
    <div className="py-4">
      {children}
    </div>
  );
}
