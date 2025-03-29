
import { format } from "date-fns";

export function createInventoryReport(container: HTMLElement, data: any[]) {
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
}

export function createSalesReport(container: HTMLElement, data: any[]) {
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
}

export function createPurchaseOrdersReport(container: HTMLElement, data: any[]) {
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
}

export function createPatientsReport(container: HTMLElement, data: any[]) {
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
}
