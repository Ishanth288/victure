
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  Package,
  Users,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  DollarSign,
  Prescription
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } bg-white border-r border-neutral-200 w-64 md:translate-x-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">Victure</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <nav className="p-4 space-y-2">
          <Link to="/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutGrid className="mr-2 h-5 w-5" />
              Dashboard
            </Button>
          </Link>
          <Link to="/inventory">
            <Button variant="ghost" className="w-full justify-start">
              <Package className="mr-2 h-5 w-5" />
              Inventory
            </Button>
          </Link>
          <Link to="/billing">
            <Button variant="ghost" className="w-full justify-start">
              <DollarSign className="mr-2 h-5 w-5" />
              Billing
            </Button>
          </Link>
          <Link to="/prescriptions">
            <Button variant="ghost" className="w-full justify-start">
              <Prescription className="mr-2 h-5 w-5" />
              Prescriptions
            </Button>
          </Link>
          <Link to="/patients">
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-5 w-5" />
              Patients
            </Button>
          </Link>
          <Link to="/reports">
            <Button variant="ghost" className="w-full justify-start">
              <BarChart3 className="mr-2 h-5 w-5" />
              Reports
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </Button>
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${
        isSidebarOpen ? "md:ml-64" : ""
      }`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center space-x-4 ml-auto">
              <Button variant="ghost">John Doe</Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}

