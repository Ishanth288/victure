import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, BarChart2, Package, FileBarChart, Users, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { generateSystemReport, downloadPDF, generatePDFFromElement } from "@/utils/documentUtils";
import { useToast } from "@/hooks/use-toast";

interface SystemDocument {
  id: string;
  type: 'inventory' | 'sales' | 'purchase_orders' | 'patients';
  name: string;
  icon: React.ReactNode;
  lastUpdated: Date | null;
  description: string;
  isLoading?: boolean;
}

export function DocumentManagement() {
  const [documents, setDocuments] = useState<SystemDocument[]>([
    { 
      id: 'inventory', 
      type: 'inventory', 
      name: 'Inventory Report', 
      icon: <Package className="h-5 w-5 text-blue-500" />,
      lastUpdated: null,
      description: 'Complete inventory status with stock levels and values'
    },
    { 
      id: 'sales', 
      type: 'sales', 
      name: 'Sales Analysis', 
      icon: <BarChart2 className="h-5 w-5 text-green-500" />,
      lastUpdated: null,
      description: 'Recent sales transactions and revenue analysis'
    },
    { 
      id: 'purchase_orders', 
      type: 'purchase_orders', 
      name: 'Purchase Orders', 
      icon: <FileBarChart className="h-5 w-5 text-orange-500" />,
      lastUpdated: null,
      description: 'Summary of all supplier purchase orders and delivery status'
    },
    { 
      id: 'patients', 
      type: 'patients', 
      name: 'Patient Registry', 
      icon: <Users className="h-5 w-5 text-purple-500" />,
      lastUpdated: null,
      description: 'Complete patient database with contact information'
    }
  ]);
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const reportContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        fetchLastUpdates();
      }
    };

    checkAuth();
    
    // Set up realtime subscriptions
    const setupRealtimeSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const channel = supabase.channel('document-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'inventory', filter: `user_id=eq.${user.id}` }, 
          () => updateDocumentLastUpdated('inventory')
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'bills', filter: `user_id=eq.${user.id}` }, 
          () => updateDocumentLastUpdated('sales')
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'purchase_orders', filter: `user_id=eq.${user.id}` }, 
          () => updateDocumentLastUpdated('purchase_orders')
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'patients', filter: `user_id=eq.${user.id}` }, 
          () => updateDocumentLastUpdated('patients')
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    const unsubscribe = setupRealtimeSubscriptions();
    return () => {
      if (unsubscribe) {
        unsubscribe.then(cleanup => cleanup && cleanup());
      }
    };
  }, []);

  const fetchLastUpdates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Inventory last update - we need to fix this since there's no created_at column
      const { data: inventoryLatest } = await supabase
        .from('inventory')
        .select('id, name')  // Just select id and name since we don't have created_at
        .eq('user_id', user.id)
        .order('id', { ascending: false })  // Order by id as a fallback 
        .limit(1)
        .single();

      // Sales last update
      const { data: salesLatest } = await supabase
        .from('bills')
        .select('id, date')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      // Purchase orders last update
      const { data: purchaseLatest } = await supabase
        .from('purchase_orders')
        .select('id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Patients last update
      const { data: patientsLatest } = await supabase
        .from('patients')
        .select('id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setDocuments(prev => prev.map(doc => {
        if (doc.id === 'inventory' && inventoryLatest) {
          return { ...doc, lastUpdated: new Date() }; // Use current date since we don't have created_at
        }
        if (doc.id === 'sales' && salesLatest) {
          return { ...doc, lastUpdated: new Date(salesLatest.date) };
        }
        if (doc.id === 'purchase_orders' && purchaseLatest) {
          return { ...doc, lastUpdated: new Date(purchaseLatest.created_at) };
        }
        if (doc.id === 'patients' && patientsLatest) {
          return { ...doc, lastUpdated: new Date(patientsLatest.created_at) };
        }
        return doc;
      }));
    } catch (error) {
      console.error("Error fetching document updates:", error);
    }
  };

  const updateDocumentLastUpdated = (docType: string) => {
    const now = new Date();
    setDocuments(prev => prev.map(doc => 
      doc.id === docType ? { ...doc, lastUpdated: now } : doc
    ));
  };

  const handleDownload = async (docType: string, docName: string) => {
    try {
      // Set loading state
      setDocuments(prev => prev.map(doc => 
        doc.id === docType ? { ...doc, isLoading: true } : doc
      ));
      
      // Generate report data
      const reportData = await generateSystemReport(docType);
      
      if (!reportData || reportData.length === 0) {
        toast({
          title: "No data available",
          description: `There is no data available for ${docName} yet.`,
          variant: "destructive"
        });
        
        setDocuments(prev => prev.map(doc => 
          doc.id === docType ? { ...doc, isLoading: false } : doc
        ));
        return;
      }
      
      // Create temporary report container
      if (!reportContainerRef.current) return;
      
      // Clear previous content
      reportContainerRef.current.innerHTML = '';

      // Style the report
      const reportDiv = document.createElement('div');
      reportDiv.style.padding = '20px';
      reportDiv.style.fontFamily = 'Arial, sans-serif';
      
      const doc = documents.find(d => d.id === docType);
      
      // Create report header
      const header = document.createElement('h1');
      header.textContent = docName;
      header.style.fontSize = '24px';
      header.style.marginBottom = '10px';
      reportDiv.appendChild(header);
      
      const description = document.createElement('p');
      description.textContent = doc?.description || '';
      description.style.fontSize = '14px';
      description.style.marginBottom = '20px';
      description.style.color = '#666';
      reportDiv.appendChild(description);
      
      // Create report content based on document type
      switch (docType) {
        case 'inventory':
          createInventoryReport(reportDiv, reportData);
          break;
        case 'sales':
          createSalesReport(reportDiv, reportData);
          break;
        case 'purchase_orders':
          createPurchaseOrdersReport(reportDiv, reportData);
          break;
        case 'patients':
          createPatientsReport(reportDiv, reportData);
          break;
      }
      
      // Append to the container
      reportContainerRef.current.appendChild(reportDiv);
      
      // Generate PDF
      const pdfDataUrl = await generatePDFFromElement(reportContainerRef.current, {
        title: docName,
        description: doc?.description,
        lastUpdated: doc?.lastUpdated || new Date()
      });
      
      if (pdfDataUrl) {
        // Download the PDF
        downloadPDF(pdfDataUrl, docName);
        
        toast({
          title: "Report downloaded",
          description: `${docName} has been generated and downloaded.`
        });
      } else {
        throw new Error("Failed to generate PDF");
      }
    } catch (error) {
      console.error(`Error downloading ${docName}:`, error);
      toast({
        title: "Error generating report",
        description: "An error occurred while generating the report.",
        variant: "destructive"
      });
    } finally {
      // Reset loading state
      setDocuments(prev => prev.map(doc => 
        doc.id === docType ? { ...doc, isLoading: false } : doc
      ));
    }
  };

  const createInventoryReport = (container: HTMLElement, data: any[]) => {
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    // Table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Name</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Quantity</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Unit Cost</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Total Value</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Status</th>
      </tr>
    `;
    table.appendChild(thead);
    
    // Table body
    const tbody = document.createElement('tbody');
    let totalValue = 0;
    
    data.forEach((item, index) => {
      const row = document.createElement('tr');
      const itemValue = (item.quantity || 0) * (item.unit_cost || 0);
      totalValue += itemValue;
      
      row.style.backgroundColor = index % 2 === 0 ? '#f9f9f9' : 'white';
      
      row.innerHTML = `
        <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.quantity || 0}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">₹${(item.unit_cost || 0).toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">₹${itemValue.toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.status || 'N/A'}</td>
      `;
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    // Summary
    const summary = document.createElement('div');
    summary.style.marginTop = '20px';
    summary.innerHTML = `
      <p><strong>Total Items:</strong> ${data.length}</p>
      <p><strong>Total Inventory Value:</strong> ₹${totalValue.toFixed(2)}</p>
      <p><strong>Report Generated:</strong> ${format(new Date(), 'PPpp')}</p>
    `;
    
    container.appendChild(table);
    container.appendChild(summary);
  };

  const createSalesReport = (container: HTMLElement, data: any[]) => {
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    // Table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Bill #</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Date</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Items</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Amount</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Status</th>
      </tr>
    `;
    table.appendChild(thead);
    
    // Table body
    const tbody = document.createElement('tbody');
    let totalSales = 0;
    
    data.forEach((bill, index) => {
      const row = document.createElement('tr');
      totalSales += (bill.total_amount || 0);
      
      row.style.backgroundColor = index % 2 === 0 ? '#f9f9f9' : 'white';
      
      const billDate = bill.date ? format(new Date(bill.date), 'yyyy-MM-dd') : 'N/A';
      const itemCount = bill.bill_items?.length || 0;
      
      row.innerHTML = `
        <td style="border: 1px solid #ddd; padding: 8px;">${bill.bill_number}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${billDate}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${itemCount}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">₹${(bill.total_amount || 0).toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${bill.status || 'N/A'}</td>
      `;
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    // Summary
    const summary = document.createElement('div');
    summary.style.marginTop = '20px';
    summary.innerHTML = `
      <p><strong>Total Bills:</strong> ${data.length}</p>
      <p><strong>Total Sales Value:</strong> ₹${totalSales.toFixed(2)}</p>
      <p><strong>Report Generated:</strong> ${format(new Date(), 'PPpp')}</p>
    `;
    
    container.appendChild(table);
    container.appendChild(summary);
  };

  const createPurchaseOrdersReport = (container: HTMLElement, data: any[]) => {
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    // Table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">PO #</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Supplier</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Order Date</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Items</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Amount</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Status</th>
      </tr>
    `;
    table.appendChild(thead);
    
    // Table body
    const tbody = document.createElement('tbody');
    let totalAmount = 0;
    
    data.forEach((order, index) => {
      const row = document.createElement('tr');
      totalAmount += (order.total_amount || 0);
      
      row.style.backgroundColor = index % 2 === 0 ? '#f9f9f9' : 'white';
      
      const orderDate = order.order_date ? format(new Date(order.order_date), 'yyyy-MM-dd') : 'N/A';
      const itemCount = order.purchase_order_items?.length || 0;
      
      row.innerHTML = `
        <td style="border: 1px solid #ddd; padding: 8px;">PO-${order.id}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${order.supplier_name}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${orderDate}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${itemCount}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">₹${(order.total_amount || 0).toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${order.status}</td>
      `;
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    // Summary
    const summary = document.createElement('div');
    summary.style.marginTop = '20px';
    summary.innerHTML = `
      <p><strong>Total Purchase Orders:</strong> ${data.length}</p>
      <p><strong>Total Order Value:</strong> ₹${totalAmount.toFixed(2)}</p>
      <p><strong>Report Generated:</strong> ${format(new Date(), 'PPpp')}</p>
    `;
    
    container.appendChild(table);
    container.appendChild(summary);
  };

  const createPatientsReport = (container: HTMLElement, data: any[]) => {
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    // Table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Patient ID</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Name</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Phone Number</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Status</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Added On</th>
      </tr>
    `;
    table.appendChild(thead);
    
    // Table body
    const tbody = document.createElement('tbody');
    
    data.forEach((patient, index) => {
      const row = document.createElement('tr');
      row.style.backgroundColor = index % 2 === 0 ? '#f9f9f9' : 'white';
      
      const createdDate = patient.created_at ? format(new Date(patient.created_at), 'yyyy-MM-dd') : 'N/A';
      
      row.innerHTML = `
        <td style="border: 1px solid #ddd; padding: 8px;">${patient.id}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${patient.name}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${patient.phone_number}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${patient.status || 'Active'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${createdDate}</td>
      `;
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    // Summary
    const summary = document.createElement('div');
    summary.style.marginTop = '20px';
    summary.innerHTML = `
      <p><strong>Total Patients:</strong> ${data.length}</p>
      <p><strong>Report Generated:</strong> ${format(new Date(), 'PPpp')}</p>
    `;
    
    container.appendChild(table);
    container.appendChild(summary);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Document Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="overflow-y-auto max-h-[250px]">
            {documents.map(doc => (
              <div 
                key={doc.id}
                className="flex items-center justify-between p-3 border-b last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  {doc.icon || <FileText className="h-5 w-5 text-blue-500" />}
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      {doc.lastUpdated 
                        ? `Updated: ${format(doc.lastUpdated, 'MMM dd, yyyy • HH:mm')}` 
                        : 'No data available'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDownload(doc.type, doc.name)}
                    disabled={doc.isLoading}
                  >
                    {doc.isLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
            
            {documents.length === 0 && (
              <div className="text-center py-4 text-gray-500 flex flex-col items-center justify-center">
                <AlertCircle className="h-8 w-8 mb-2 text-gray-400" />
                <p>No system documents available.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Hidden container for report generation */}
        <div 
          ref={reportContainerRef} 
          className="hidden" 
          style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
        ></div>
      </CardContent>
    </Card>
  );
}
