
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
    const pharmacyProfile = await getPharmacyProfile();
    
    // Create a white background div to wrap content 
    const whiteBackground = document.createElement('div');
    whiteBackground.style.backgroundColor = 'white';
    whiteBackground.style.padding = '20px';
    whiteBackground.appendChild(element.cloneNode(true));
    document.body.appendChild(whiteBackground);
    
    const canvas = await html2canvas(whiteBackground, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff'
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
    
    // Add header with Victure branding and pharmacy info
    pdf.setFillColor(0, 51, 102); // Dark blue background
    pdf.rect(0, 0, 210, 30, 'F');
    
    // Add Victure branding
    pdf.setTextColor(255, 255, 255); // White text
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('VICTURE HEALTHCARE SOLUTIONS', 105, 12, { align: 'center' });
    
    // Add pharmacy name
    pdf.setFontSize(14);
    pdf.text(pharmacyProfile?.pharmacy_name || 'Pharmacy', 105, 20, { align: 'center' });
    
    // Add report title
    pdf.setFontSize(12);
    pdf.text(options.title, 105, 27, { align: 'center' });
    
    // Add content (shifted down to accommodate the header)
    pdf.addImage(imgData, 'PNG', 0, 35, imgWidth, imgHeight);
    
    // Add footer with last updated info
    const currentDate = options.lastUpdated ? format(options.lastUpdated, 'PPpp') : format(new Date(), 'PPpp');
    
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Last Updated: ${currentDate}`, 105, 285, { align: 'center' });
    
    if (pharmacyProfile) {
      const addressText = [
        pharmacyProfile.address,
        `${pharmacyProfile.city}, ${pharmacyProfile.state} - ${pharmacyProfile.pincode}`,
        `GSTIN: ${pharmacyProfile.gstin || 'N/A'}`
      ].filter(Boolean).join(' | ');
      
      pdf.text(addressText, 105, 290, { align: 'center' });
    }
    
    // Add Victure footer text
    pdf.text("Powered by Victure Healthcare Solutions", 105, 295, { align: 'center' });
    
    // Generate data URL
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
      
      case 'sales':
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
