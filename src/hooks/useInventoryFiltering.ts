
import { useState, useEffect } from "react";
import { InventoryItem } from "@/types/inventory";

export function useInventoryFiltering(inventory: InventoryItem[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const handleApplyFilter = (type: string) => {
    setFilterType(type === filterType ? null : type);
    setCurrentPage(1);
  };

  const filteredItems = inventory.filter((item) => {
    // First filter by search query
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.generic_name && item.generic_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.manufacturer && item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Then apply other filters if any
    if (!matchesSearch) return false;
    
    if (filterType === "lowStock") {
      return item.quantity < (item.reorder_point || 10);
    } else if (filterType === "expiringSoon") {
      if (!item.expiry_date) return false;
      
      const expiryDate = new Date(item.expiry_date);
      const now = new Date();
      const monthsDiff = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      return monthsDiff <= 3; // Items expiring within 3 months
    }
    
    return true;
  });

  useEffect(() => {
    setTotalPages(Math.ceil(filteredItems.length / itemsPerPage));
    setCurrentPage(1);
  }, [filteredItems]);

  // Get the current page's items
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return {
    searchQuery,
    setSearchQuery,
    filterType,
    handleApplyFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredItems,
    paginatedItems,
    itemsPerPage
  };
}
