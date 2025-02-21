import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, Search, Filter, Plus, ArrowUpDown, 
  AlertTriangle, Clock, Download, Calendar,
  X, AlertOctagon, ChevronUp, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface InventoryItemFormData {
  name: string;
  genericName: string;
  ndc: string;
  manufacturer: string;
  dosageForm: string;
  strength: string;
  unitSize: string;
  unitCost: string;
  sellingPrice: string;
  quantity: string;
  reorderPoint: string;
  expiryDate: string;
  supplier: string;
  storage: string;
}

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

  const toggleItemSelection = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

  const InventoryForm = ({ isEdit = false }) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Medicine Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter medicine name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="genericName">Generic Name</Label>
          <Input
            id="genericName"
            name="genericName"
            value={formData.genericName}
            onChange={handleInputChange}
            placeholder="Enter generic name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ndc">NDC</Label>
          <Input
            id="ndc"
            name="ndc"
            value={formData.ndc}
            onChange={handleInputChange}
            placeholder="Enter NDC"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manufacturer">Manufacturer</Label>
          <Input
            id="manufacturer"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleInputChange}
            placeholder="Enter manufacturer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dosageForm">Dosage Form</Label>
          <Select
            value={formData.dosageForm}
            onValueChange={(value) => handleSelectChange("dosageForm", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select dosage form" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tablet">Tablet</SelectItem>
              <SelectItem value="capsule">Capsule</SelectItem>
              <SelectItem value="liquid">Liquid</SelectItem>
              <SelectItem value="injection">Injection</SelectItem>
              <SelectItem value="ointment">Ointment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="strength">Strength/Concentration</Label>
          <Input
            id="strength"
            name="strength"
            value={formData.strength}
            onChange={handleInputChange}
            placeholder="e.g., 500mg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitCost">Unit Cost (₹)</Label>
          <Input
            id="unitCost"
            name="unitCost"
            type="number"
            value={formData.unitCost}
            onChange={handleInputChange}
            placeholder="Enter unit cost"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sellingPrice">Selling Price (₹)</Label>
          <Input
            id="sellingPrice"
            name="sellingPrice"
            type="number"
            value={formData.sellingPrice}
            onChange={handleInputChange}
            placeholder="Enter selling price"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleInputChange}
            placeholder="Enter quantity"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reorderPoint">Reorder Point</Label>
          <Input
            id="reorderPoint"
            name="reorderPoint"
            type="number"
            value={formData.reorderPoint}
            onChange={handleInputChange}
            placeholder="Enter reorder point"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            name="expiryDate"
            type="date"
            value={formData.expiryDate}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="storage">Storage Conditions</Label>
          <Select
            value={formData.storage}
            onValueChange={(value) => handleSelectChange("storage", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select storage condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="room">Room Temperature</SelectItem>
              <SelectItem value="refrigerated">Refrigerated</SelectItem>
              <SelectItem value="frozen">Frozen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setFormData(initialFormData);
            if (isEdit) {
              setIsEditModalOpen(false);
            } else {
              setIsAddModalOpen(false);
            }
          }}
        >
          Cancel
        </Button>
        <Button>
          {isEdit ? "Save Changes" : "Add Item"}
        </Button>
      </div>
    </div>
  );

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
            <Button className="gap-2">
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
                {inventoryData.map((item) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
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
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>
                Add a new item to your inventory. Fill in all required fields.
              </DialogDescription>
            </DialogHeader>
            <InventoryForm />
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
            <InventoryForm isEdit />
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
