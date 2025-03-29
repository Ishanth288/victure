
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProductsChart } from "@/components/insights/ProductsChart";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ProductsSectionProps {
  isLoading: boolean;
  topProducts: Array<{name: string, value: number}>;
}

export function ProductsSection({ isLoading, topProducts }: ProductsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Products</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p>Loading product data...</p>
          </div>
        ) : topProducts.length > 0 ? (
          <ProductsChart data={topProducts} />
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Product Data</AlertTitle>
            <AlertDescription>
              There is not enough sales data to show top products.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
