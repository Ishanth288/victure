import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Search, Filter, Download, RefreshCw, Trash2, Package, User, FileText, AlertCircle, Clock, DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, endOfDay, subDays, subWeeks, subMonths } from 'date-fns';

// Temporary interface until database migration is applied
interface DeletionRecord {
  id: number;
  entity_type: string;
  entity_id: number;
  entity_data: any;
  deletion_reason: string | null;
  deletion_type: string;
  patient_id?: number | null;
  prescription_id?: number | null;
  bill_id?: number | null;
  medicine_name?: string | null;
  deleted_by: string;
  deleted_at: string;
  amount_affected?: number | null;
  quantity_affected?: number | null;
  notes?: string | null;
  is_reversible: boolean;
  reversal_deadline?: string | null;
}

const DeletionHistory = () => {
  const [deletions, setDeletions] = useState<DeletionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const { toast } = useToast();

  // Mobile responsiveness state
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchDeletionHistory();
  }, []);

  const fetchDeletionHistory = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration until database migration is applied
      const mockData: DeletionRecord[] = [
        {
          id: 1,
          entity_type: 'bill_item',
          entity_id: 123,
          entity_data: { name: 'Paracetamol 500mg' },
          deletion_reason: 'Customer returned - expired medicine',
          deletion_type: 'return',
          patient_id: 45,
          prescription_id: 67,
          bill_id: 89,
          medicine_name: 'Paracetamol 500mg',
          deleted_by: 'user-123',
          deleted_at: new Date().toISOString(),
          amount_affected: 125.50,
          quantity_affected: 5,
          notes: 'Customer complained about expired product',
          is_reversible: true,
          reversal_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          entity_type: 'prescription',
          entity_id: 456,
          entity_data: { prescription_number: 'RX-2024-001' },
          deletion_reason: 'Duplicate prescription entry',
          deletion_type: 'manual',
          patient_id: 78,
          prescription_id: 456,
          medicine_name: null,
          deleted_by: 'user-123',
          deleted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          amount_affected: 0,
          quantity_affected: null,
          notes: 'Duplicate created by mistake',
          is_reversible: false,
          reversal_deadline: null
        },
        {
          id: 3,
          entity_type: 'medicine_return',
          entity_id: 789,
          entity_data: { return_id: 789 },
          deletion_reason: 'Wrong return entry',
          deletion_type: 'cleanup',
          patient_id: 90,
          bill_id: 112,
          medicine_name: 'Amoxicillin 250mg',
          deleted_by: 'user-456',
          deleted_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          amount_affected: 89.75,
          quantity_affected: 3,
          notes: 'Incorrect return quantity recorded',
          is_reversible: true,
          reversal_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDeletions(mockData);
      
      toast({
        title: "Demo Mode",
        description: "Showing sample deletion history. Database migration needed for live data.",
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtering and searching logic
  const filteredDeletions = useMemo(() => {
    let filtered = deletions;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(deletion => 
        deletion.medicine_name?.toLowerCase().includes(query) ||
        deletion.deletion_reason?.toLowerCase().includes(query) ||
        deletion.notes?.toLowerCase().includes(query) ||
        deletion.entity_data?.name?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(deletion => deletion.entity_type === filterType);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case 'today':
          startDate = startOfDay(now);
          break;
        case 'week':
          startDate = subWeeks(now, 1);
          break;
        case 'month':
          startDate = subMonths(now, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      filtered = filtered.filter(deletion => 
        new Date(deletion.deleted_at) >= startDate
      );
    }

    // Sorting
    switch (sortBy) {
      case 'date_asc':
        filtered.sort((a, b) => new Date(a.deleted_at).getTime() - new Date(b.deleted_at).getTime());
        break;
      case 'date_desc':
        filtered.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
        break;
      case 'amount_desc':
        filtered.sort((a, b) => (b.amount_affected || 0) - (a.amount_affected || 0));
        break;
      case 'amount_asc':
        filtered.sort((a, b) => (a.amount_affected || 0) - (b.amount_affected || 0));
        break;
    }

    return filtered;
  }, [deletions, searchQuery, filterType, dateRange, sortBy]);

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'bill_item':
        return <Package className="h-4 w-4" />;
      case 'prescription':
        return <FileText className="h-4 w-4" />;
      case 'patient':
        return <User className="h-4 w-4" />;
      case 'medicine_return':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Trash2 className="h-4 w-4" />;
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'bill_item':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'prescription':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'patient':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'medicine_return':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getDeletionTypeColor = (deletionType: string) => {
    switch (deletionType) {
      case 'manual':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'return':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'replacement':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'cleanup':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const exportToCSV = () => {
    const csv = [
      ['Date', 'Type', 'Entity', 'Medicine/Item', 'Reason', 'Amount', 'Quantity'].join(','),
      ...filteredDeletions.map(deletion => [
        format(new Date(deletion.deleted_at), 'yyyy-MM-dd HH:mm'),
        deletion.deletion_type,
        deletion.entity_type,
        deletion.medicine_name || 'N/A',
        deletion.deletion_reason || 'N/A',
        deletion.amount_affected || 0,
        deletion.quantity_affected || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deletion-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Mobile Card Component
  const MobileDeletionCard = ({ deletion }: { deletion: DeletionRecord }) => (
    <Card className="mb-4 shadow-sm border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getEntityIcon(deletion.entity_type)}
            <Badge className={getEntityTypeColor(deletion.entity_type)}>
              {deletion.entity_type.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <Badge className={getDeletionTypeColor(deletion.deletion_type)}>
            {deletion.deletion_type.toUpperCase()}
          </Badge>
        </div>
        <CardTitle className="text-sm font-medium">
          {deletion.medicine_name || deletion.entity_data?.name || `${deletion.entity_type} #${deletion.entity_id}`}
        </CardTitle>
        <CardDescription className="text-xs">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{format(new Date(deletion.deleted_at), 'MMM dd, yyyy HH:mm')}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          {deletion.deletion_reason && (
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-orange-500 flex-shrink-0" />
              <span className="text-gray-600 dark:text-gray-400">{deletion.deletion_reason}</span>
            </div>
          )}
          
          {(deletion.amount_affected || deletion.quantity_affected) && (
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
              {deletion.amount_affected && (
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-3 w-3 text-green-600" />
                  <span className="font-medium">₹{deletion.amount_affected}</span>
                </div>
              )}
              {deletion.quantity_affected && (
                <div className="flex items-center space-x-1">
                  <Package className="h-3 w-3 text-blue-600" />
                  <span className="font-medium">{deletion.quantity_affected} units</span>
                </div>
              )}
            </div>
          )}

          {deletion.notes && (
            <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded">
              {deletion.notes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Desktop Table Row Component
  const DesktopTableRow = ({ deletion }: { deletion: DeletionRecord }) => (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          {getEntityIcon(deletion.entity_type)}
          <Badge className={getEntityTypeColor(deletion.entity_type)}>
            {deletion.entity_type.replace('_', ' ')}
          </Badge>
        </div>
      </td>
      <td className="px-4 py-3 font-medium">
        {deletion.medicine_name || deletion.entity_data?.name || `#${deletion.entity_id}`}
      </td>
      <td className="px-4 py-3">
        <Badge className={getDeletionTypeColor(deletion.deletion_type)}>
          {deletion.deletion_type}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
        {deletion.deletion_reason || '-'}
      </td>
      <td className="px-4 py-3 text-sm">
        {format(new Date(deletion.deleted_at), 'MMM dd, yyyy HH:mm')}
      </td>
      <td className="px-4 py-3 text-right">
        {deletion.amount_affected ? `₹${deletion.amount_affected}` : '-'}
      </td>
      <td className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
        {deletion.quantity_affected || '-'}
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading deletion history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Deletion History
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track and audit all deletions and returns in your pharmacy system
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-4'}`}>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search medicine, reason, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Entity Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bill_item">Bill Items</SelectItem>
                <SelectItem value="prescription">Prescriptions</SelectItem>
                <SelectItem value="patient">Patients</SelectItem>
                <SelectItem value="medicine_return">Returns</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort and Export */}
            <div className="flex space-x-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Newest First</SelectItem>
                  <SelectItem value="date_asc">Oldest First</SelectItem>
                  <SelectItem value="amount_desc">Highest Amount</SelectItem>
                  <SelectItem value="amount_asc">Lowest Amount</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="whitespace-nowrap"
              >
                <Download className="h-4 w-4 mr-1" />
                {isMobile ? '' : 'Export'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredDeletions.length} of {deletions.length} deletion records
        </p>
      </div>

      {/* Content */}
      {filteredDeletions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No deletions found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || filterType !== 'all' || dateRange !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No deletion history available yet'}
            </p>
          </CardContent>
        </Card>
      ) : isMobile ? (
        // Mobile Cards View
        <div className="space-y-4">
          {filteredDeletions.map((deletion) => (
            <MobileDeletionCard key={deletion.id} deletion={deletion} />
          ))}
        </div>
      ) : (
        // Desktop Table View
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item/Entity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deletion Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDeletions.map((deletion) => (
                  <DesktopTableRow key={deletion.id} deletion={deletion} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <Button
          variant="outline"
          onClick={fetchDeletionHistory}
          disabled={loading}
          className="w-full md:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh History
        </Button>
      </div>
    </div>
  );
};

export default DeletionHistory; 