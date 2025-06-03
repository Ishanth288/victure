
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { safeQueryData } from './safeSupabaseQueries';

interface DocumentGenerationOptions {
  title: string;
  description?: string;
  lastUpdated?: Date;
  footerText?: string;
}

/**
 * Gets the current pharmacy profile data for document branding
 */
export const getPharmacyProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const profileData = await safeQueryData(
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      null
    );

    return profileData;
  } catch (error) {
    console.error('Error fetching pharmacy profile:', error);
    return null;
  }
};

/**
 * Generates a PDF document from the provided HTML element
 */
export const generatePDFFromElement = async (
  element: HTMLElement,
  options: DocumentGenerationOptions
): Promise<string | null> => {
  try {
    console.log("Generating PDF with element:", element);
    const pharmacyProfile = await getPharmacyProfile();
    
    // Create a white background div to wrap content 
    const whiteBackground = document.createElement('div');
    whiteBackground.style.backgroundColor = 'white';
    whiteBackground.style.padding = '20px';
    whiteBackground.style.width = '800px';  // Set a fixed width for consistent PDF generation
    whiteBackground.appendChild(element.cloneNode(true));
    document.body.appendChild(whiteBackground);
    
    const canvas = await html2canvas(whiteBackground, {
      scale: 2,
      logging: true,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: 1000
    });
    
    document.body.removeChild(whiteBackground);
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 0;
    let heightLeft = imgHeight;
    const pageHeight = pdf.internal.pageSize.height;
    const headerHeight = 30;
    const footerHeight = 20;
    const contentStart = headerHeight + 5; // Space after header
    const contentEnd = pageHeight - footerHeight - 5; // Space before footer
    const contentHeight = contentEnd - contentStart;

    while (heightLeft > 0) {
      pdf.addPage();
      const currentPage = pdf.getNumberOfPages();

      // Header
      pdf.setFillColor(0, 51, 102); // Dark blue background
      pdf.rect(0, 0, 210, headerHeight, 'F');

      pdf.setTextColor(255, 255, 255); // White text
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('VICTURE HEALTHCARE SOLUTIONS', 105, 8, { align: 'center' });

      pdf.setFontSize(10);
      pdf.text(`Pharmacy Name: ${pharmacyProfile?.pharmacy_name || 'N/A'}`, 10, 18);
      pdf.text(`Pharmacy Address: ${pharmacyProfile?.address || 'N/A'}, ${pharmacyProfile?.city || ''} - ${pharmacyProfile?.pincode || ''}`, 10, 23);
      pdf.text(`Report: ${options.title}`, 10, 28);

      // Content
      const currentContentHeight = Math.min(heightLeft, contentHeight);
      pdf.addImage(imgData, 'PNG', 0, contentStart, imgWidth, currentContentHeight);
      heightLeft -= currentContentHeight;
      position += currentContentHeight;

      // Footer
      const currentDate = options.lastUpdated ? format(options.lastUpdated, 'PPpp') : format(new Date(), 'PPpp');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Last Updated: ${currentDate}`, 10, pageHeight - 15);
      pdf.text(`Page ${currentPage} of ${Math.ceil(imgHeight / contentHeight)}`, 190, pageHeight - 15, { align: 'right' });
      pdf.text('Powered by Victure Healthcare Solutions', 105, pageHeight - 10, { align: 'center' });
    }

    // Remove the first blank page added by default
    pdf.deletePage(1);

    return pdf.output('dataurlstring');
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
};

/**
 * Download data as PDF
 */
export const downloadPDF = (dataUrl: string, filename: string) => {
  console.log("Downloading PDF with dataUrl:", dataUrl ? "Data URL exists" : "No data URL");
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${filename.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate a system report based on data type
 */
export const generateSystemReport = async (dataType: string): Promise<any> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    switch (dataType) {
      case 'inventory':
        return safeQueryData(
          supabase.from('inventory')
            .select('*')
            .eq('user_id', user.id)
            .order('name', { ascending: true }),
          []
        );
      
      case 'sales_analysis':
        return safeQueryData(
          supabase.from('bills')
            .select('*, bill_items(*)')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(100),
          []
        );
      
      case 'purchase_orders':
        return safeQueryData(
          supabase.from('purchase_orders')
            .select('*, purchase_order_items(*)')
            .eq('user_id', user.id)
            .order('order_date', { ascending: false }),
          []
        );
      
      case 'patients':
        return safeQueryData(
          supabase.from('patients')
            .select('*')
            .eq('user_id', user.id)
            .order('name', { ascending: true }),
          []
        );
      
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error fetching ${dataType} data:`, error);
    return null;
  }
};
