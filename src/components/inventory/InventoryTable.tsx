import React, { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Skeleton from "@/components/ui/skeleton-loader";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Package, AlertTriangle } from "lucide-react";
import { InventoryItem } from "@/types/inventory";
import { useIsMobile } from "@/hooks/use-mobile";

interface InventoryTableProps {
  items: InventoryItem[];
  selectedItems: number[];
  onToggleItem: (id: number) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: number) => void;
  isLoading?: boolean;
  error?: string | null;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  selectedItems,
  onToggleItem,
  onEditItem,
  onDeleteItem,
  isLoading = false,
  error = null,
}) => {
  const isMobile = useIsMobile();
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InventoryItem;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Memoize sorted items to prevent unnecessary re-calculations
  const sortedItems = useMemo(() => {
    if (!sortConfig) return items;

    return [...items].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [items, sortConfig]);

  const handleSort = useCallback((key: keyof InventoryItem) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const getStockStatus = useCallback((quantity: number, reorderPoint: number) => {
    if (quantity <= 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (quantity <= reorderPoint) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  }, []);

  if (error) {
    return (
      <div className="border rounded-lg p-8 text-center bg-red-50 border-red-200">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Inventory</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="border rounded-lg p-8">
        <Skeleton variant="table" rows={5} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Items Found</h3>
        <p className="text-gray-600">Start by adding your first inventory item.</p>
      </div>
    );
  }

  // Mobile Card View - Remove fixed height ScrollArea
  if (isMobile) {
    return (
      <div className="space-y-4" role="list" aria-label="Inventory items">
        <div className="space-y-3">
          {sortedItems.map((item) => {
            const stockStatus = getStockStatus(item.quantity, item.reorder_point);
            const isSelected = selectedItems.includes(item.id);

            return (
              <div
                key={item.id}
                className={`
                  p-4 border rounded-lg bg-white shadow-sm transition-all
                  ${isSelected ? 'ring-2 ring-teal-500 border-teal-200' : 'border-gray-200'}
                `}
                role="listitem"
                aria-labelledby={`item-name-${item.id}`}
                aria-describedby={`item-details-${item.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleItem(item.id)}
                      aria-label={`Select ${item.name}`}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 
                        id={`item-name-${item.id}`}
                        className="font-semibold text-gray-900 truncate"
                      >
                        {item.name}
                      </h3>
                      {item.generic_name && (
                        <p className="text-sm text-gray-600 truncate">
                          {item.generic_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={stockStatus.variant} className="ml-2">
                    {stockStatus.label}
                  </Badge>
                </div>

                <div 
                  id={`item-details-${item.id}`}
                  className="grid grid-cols-2 gap-3 text-sm mb-3"
                >
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <span className="ml-1 font-medium">{item.quantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cost:</span>
                    <span className="ml-1 font-medium">₹{item.unit_cost.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <span className="ml-1 font-medium">₹{item.selling_price?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Supplier:</span>
                    <span className="ml-1 font-medium">{item.supplier || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditItem(item)}
                    aria-label={`Edit ${item.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteItem(item.id)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop Table View - No fixed height or ScrollArea
  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]" role="table" aria-label="Inventory items table">
          <thead className="bg-gray-50">
            <tr role="row">
              <th className="w-12 p-4" role="columnheader">
                <Checkbox
                  checked={selectedItems.length === items.length && items.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      items.forEach(item => {
                        if (!selectedItems.includes(item.id)) {
                          onToggleItem(item.id);
                        }
                      });
                    } else {
                      selectedItems.forEach(id => onToggleItem(id));
                    }
                  }}
                  aria-label="Select all items"
                />
              </th>
              {[
                { key: 'name', label: 'Name' },
                { key: 'quantity', label: 'Quantity' },
                { key: 'unit_cost', label: 'Unit Cost' },
                { key: 'selling_price', label: 'Selling Price' },
                { key: 'supplier', label: 'Supplier' },
                { key: 'expiry_date', label: 'Expiry' },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="text-left p-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(key as keyof InventoryItem)}
                  role="columnheader"
                  aria-sort={
                    sortConfig?.key === key
                      ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                      : 'none'
                  }
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort(key as keyof InventoryItem);
                    }
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <span>{label}</span>
                    {sortConfig?.key === key && (
                      <span aria-hidden="true">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className="text-left p-4 font-medium text-gray-900" role="columnheader">
                Status
              </th>
              <th className="text-left p-4 font-medium text-gray-900" role="columnheader">
                Actions
              </th>
            </tr>
          </thead>
          <tbody role="rowgroup">
            {sortedItems.map((item) => {
              const stockStatus = getStockStatus(item.quantity, item.reorder_point);
              const isSelected = selectedItems.includes(item.id);

              return (
                <tr
                  key={item.id}
                  className={`
                    border-t hover:bg-gray-50 transition-colors
                    ${isSelected ? 'bg-teal-50 border-teal-200' : ''}
                  `}
                  role="row"
                  aria-selected={isSelected}
                >
                  <td className="p-4" role="gridcell">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleItem(item.id)}
                      aria-label={`Select ${item.name}`}
                    />
                  </td>
                  <td className="p-4" role="gridcell">
                    <div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      {item.generic_name && (
                        <div className="text-sm text-gray-600">{item.generic_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-medium" role="gridcell">
                    {item.quantity}
                  </td>
                  <td className="p-4" role="gridcell">
                    ₹{item.unit_cost.toFixed(2)}
                  </td>
                  <td className="p-4" role="gridcell">
                    ₹{item.selling_price?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="p-4" role="gridcell">
                    {item.supplier || 'N/A'}
                  </td>
                  <td className="p-4" role="gridcell">
                    {item.expiry_date || 'N/A'}
                  </td>
                  <td className="p-4" role="gridcell">
                    <Badge variant={stockStatus.variant}>
                      {stockStatus.label}
                    </Badge>
                  </td>
                  <td className="p-4" role="gridcell">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditItem(item)}
                        aria-label={`Edit ${item.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;
