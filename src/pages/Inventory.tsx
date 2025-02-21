import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, Search, Filter, Plus, ArrowUpDown, 
  AlertTriangle, Clock, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import InventoryForm, { InventoryItemFormData } from "@/components/inventory/InventoryForm";

const inventoryData = [
  {
    id: 1,
    name: "Amoxicillin",
    ndc: "12345-678-90",
    manufacturer: "PharmaCo",
    dosageForm: "Tablet",
    unitSize: "500mg",
    quantity: 150,
    unitCost: 2.5,
    expiryDate: "2024-12-31",
    supplier: "MedSupply Inc",
    status: "In Stock",
  },
  {
    id: 2,
    name: "Lisinopril",
    ndc: "98765-432-10",
    manufacturer: "MediPharm",
    dosageForm: "Tablet",
    unitSize: "10mg",
    quantity: 50,
    unitCost: 1.75,
    expiryDate: "2024-06-30",
    supplier: "PharmaDist",
    status: "Low Stock",
  },
  {
    id: 3,
    name: "Ibuprofen",
    ndc: "45678-901-23",
    manufacturer: "HealthCare",
    dosageForm: "Capsule",
    unitSize: "200mg",
    quantity: 0,
    unitCost: 0.5,
    expiryDate: "2024-03-15",
    supplier: "MedSupply Inc",
    status: "Out of Stock",
  },
];

const initialFormData: InventoryItemFormData = {
  name: "",
  genericName: "",
  ndc: "",
  manufacturer: "",
  dosageForm: "",
  strength: "",
  unitSize: "",
  unitCost: "",
  sellingPrice: "",
  quantity: "",
  reorderPoint: "",
  expiryDate: "",
  supplier: "",
  storage: "",
};

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<InventoryItemFormData>(initialFormData);
  const [editingItem, setEditingItem] = useState<typeof inventoryData[0] | null>(null);
  const [inventory, setInventory] = useState(inventoryData);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "in stock":
        return "bg-green-100 text-green-800";
      case "low stock":
        return "bg-yellow-100 text-yellow-800";
      case "out of stock":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getExpiryColor = (date: string) => {
    const expiryDate = new Date(date);
    const today = new Date();
    const monthsDiff = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsDiff <= 1) return "text-red-500";
    if (monthsDiff <= 3) return "text-yellow-500";
    return "text-neutral-600";
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleEditClick = (item: typeof inventoryData[0]) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      genericName: "",
      ndc: item.ndc,
      manufacturer: item.manufacturer,
      dosageForm: item.dosageForm,
      strength: item.unitSize,
      unitSize: item.unitSize,
      unitCost: item.unitCost.toString(),
      sellingPrice: (item.unitCost * 1.3).toString(),
      quantity: item.quantity.toString(),
      reorderPoint: "10",
      expiryDate: item.expiryDate,
      supplier: item.supplier,
      storage: "Room Temperature",
    });
    setIsEditModalOpen(true);
  };

  const toggleItemSelection = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleAddItem = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newItem = {
      id: inventory.length + 1,
      name: formData.name,
      ndc: formData.ndc,
      manufacturer: formData.manufacturer,
      dosageForm: formData.dosageForm,
      unitSize: formData.strength,
      quantity: parseInt(formData.quantity),
      unitCost: parseFloat(formData.unitCost),
      expiryDate: formData.expiryDate,
      supplier: formData.supplier || "Not specified",
      status: parseInt(formData.quantity) > parseInt(formData.reorderPoint) ? "In Stock" : "Low Stock",
    };

    setInventory(prev => [...prev, newItem]);
    setFormData(initialFormData);
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = async () => {
    if (!editingItem) return;

    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedItem = {
      ...editingItem,
      name: formData.name,
      ndc: formData.ndc,
      manufacturer: formData.manufacturer,
      dosageForm: formData.dosageForm,
      unitSize: formData.strength,
      quantity: parseInt(formData.quantity),
      unitCost: parseFloat(formData.unitCost),
      expiryDate: formData.expiryDate,
      supplier: formData.supplier || "Not specified",
      status: parseInt(formData.quantity) > parseInt(formData.reorderPoint) ? "In Stock" : "Low Stock",
    };

    setInventory(prev => 
      prev.map(item => 
        item.id === editingItem.id ? updatedItem : item
      )
    );
    setFormData(initialFormData);
    setEditingItem(null);
    setIsEditModalOpen(false);
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-neutral-900"
            >
              Inventory Management
            </motion.h1>
            <p className="text-neutral-600 mt-1">
              Manage and track your pharmacy inventory
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search by name, NDC, or manufacturer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Clock className="h-4 w-4" />
                Expiring Soon
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Low Stock
              </Button>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <Checkbox />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <span>Name</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">NDC</th>
                  <th className="px-4 py-3 text-left">Manufacturer</th>
                  <th className="px-4 py-3 text-left">Quantity</th>
                  <th className="px-4 py-3 text-left">Unit Cost</th>
                  <th className="px-4 py-3 text-left">Expiry Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {inventory.map((item) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="border-b border-neutral-200 hover:bg-neutral-50"
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-neutral-600">{item.ndc}</td>
                      <td className="px-4 py-3 text-neutral-600">{item.manufacturer}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">${item.unitCost.toFixed(2)}</td>
                      <td className={`px-4 py-3 ${getExpiryColor(item.expiryDate)}`}>
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditClick(item)}
                        >
                          Edit
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>
                Add a new item to your inventory. Fill in all required fields.
              </DialogDescription>
            </DialogHeader>
            <InventoryForm
              formData={formData}
              onInputChange={handleInputChange}
              onSelectChange={handleSelectChange}
              onCancel={() => {
                setFormData(initialFormData);
                setIsAddModalOpen(false);
              }}
              onSubmit={handleAddItem}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
              <DialogDescription>
                Update the item details. All changes will be saved automatically.
              </DialogDescription>
            </DialogHeader>
            <InventoryForm
              formData={formData}
              isEdit
              onInputChange={handleInputChange}
              onSelectChange={handleSelectChange}
              onCancel={() => {
                setFormData(initialFormData);
                setIsEditModalOpen(false);
              }}
              onSubmit={handleEditSubmit}
            />
          </DialogContent>
        </Dialog>

        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Showing 1-3 of 3 items
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
