import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Download,
  Printer,
  ArrowLeftRight,
  DollarSign,
  Package,
  Calendar,
  User,
  Phone,
  Stethoscope,
} from "lucide-react";

interface PreviewItem {
  id: number;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  type?: 'original' | 'return' | 'replacement';
  reason?: string;
}

interface ReturnReplacementPreviewData {
  bill_number: string;
  date: string;
  type: 'return' | 'replacement';
  patient?: {
    name: string;
    phone_number?: string;
  };
  doctor_name?: string;
  prescription_number?: string;
  items: PreviewItem[];
  subtotal: number;
  gst_amount: number;
  gst_percentage: number;
  total_amount: number;
  refund_amount?: number;
  additional_charge?: number;
  net_amount: number;
}

interface ReturnReplacementPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReturnReplacementPreviewData | null;
  onConfirm: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  isProcessing?: boolean;
}

export function ReturnReplacementPreviewDialog({
  isOpen,
  onClose,
  data: previewData,
  onConfirm,
  onPrint,
  onDownload,
  isProcessing = false,
}: ReturnReplacementPreviewDialogProps) {
  if (!previewData) return null;

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = () => {
    return previewData.type === 'return' ? (
      <ArrowLeftRight className="h-5 w-5 text-orange-600" />
    ) : (
      <Package className="h-5 w-5 text-blue-600" />
    );
  };

  const getTypeTitle = () => {
    return previewData.type === 'return' ? 'Medicine Return Preview' : 'Medicine Replacement Preview';
  };

  const getTypeDescription = () => {
    return previewData.type === 'return'
      ? 'Review the return details before processing'
      : 'Review the replacement details before processing';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon()}
            {getTypeTitle()}
          </DialogTitle>
          <p className="text-sm text-gray-600">{getTypeDescription()}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Header Information */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{previewData.bill_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{formatDate(previewData.date)}</span>
                </div>
              </div>
              
              {previewData.patient && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{previewData.patient.name}</span>
                  </div>
                  {previewData.patient.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{previewData.patient.phone_number}</span>
                    </div>
                  )}
                  {previewData.doctor_name && (
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Dr. {previewData.doctor_name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Items Section */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="h-4 w-4" />
              {previewData.type === 'return' ? 'Items Being Returned' : 'Replacement Details'}
            </h3>
            
            <div className="space-y-3">
              {previewData.items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-lg">{item.medicine_name}</span>
                        {item.type && (
                          <Badge 
                            variant={item.type === 'return' ? 'destructive' : item.type === 'replacement' ? 'default' : 'secondary'}
                            className="text-xs font-medium"
                          >
                            {item.type === 'return' ? 'RETURNED' : item.type === 'replacement' ? 'REPLACED' : item.type.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Quantity:</span> {Math.abs(item.quantity)}
                        </div>
                        <div>
                          <span className="font-medium">Unit Price:</span> {formatCurrency(item.unit_price)}
                        </div>
                        <div>
                          <span className="font-medium">Subtotal:</span> {formatCurrency(Math.abs(item.quantity) * item.unit_price)}
                        </div>
                        <div>
                          <span className="font-medium">GST ({previewData.gst_percentage}%):</span> {formatCurrency((Math.abs(item.quantity) * item.unit_price) * (previewData.gst_percentage / 100))}
                        </div>
                      </div>
                      
                      {item.reason && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <span className="font-medium text-gray-700">Reason:</span> <span className="text-gray-600">{item.reason}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold">
                        {item.quantity < 0 ? '-' : '+'}{formatCurrency(Math.abs(item.total_price))}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.type === 'return' ? 'Refund' : item.type === 'replacement' ? 'Charge' : 'Amount'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Financial Summary */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financial Summary
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(previewData.subtotal)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>GST ({previewData.gst_percentage}%):</span>
                <span>{formatCurrency(previewData.gst_amount)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-medium">
                <span>Total Amount:</span>
                <span>{formatCurrency(previewData.total_amount)}</span>
              </div>
              
              {previewData.refund_amount !== undefined && previewData.refund_amount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Refund Amount:</span>
                  <span>-{formatCurrency(previewData.refund_amount)}</span>
                </div>
              )}
              
              {previewData.additional_charge !== undefined && previewData.additional_charge > 0 && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Additional Charge:</span>
                  <span>+{formatCurrency(previewData.additional_charge)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Net Amount:</span>
                <span className={previewData.net_amount >= 0 ? 'text-red-600' : 'text-green-600'}>
                  {previewData.net_amount >= 0 ? '+' : ''}{formatCurrency(previewData.net_amount)}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mt-2">
                {previewData.net_amount > 0 
                  ? 'Customer needs to pay additional amount'
                  : previewData.net_amount < 0
                  ? 'Customer will receive refund'
                  : 'No additional payment required'
                }
              </div>
            </div>
          </Card>

        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {onPrint && (
              <Button variant="outline" size="sm" onClick={onPrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            )}
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : `Confirm ${previewData.type === 'return' ? 'Return' : 'Replacement'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}