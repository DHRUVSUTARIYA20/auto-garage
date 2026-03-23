import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer } from "lucide-react";

interface SimpleBillProps {
  trackingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  vehicle: string;
  serviceDate: string;
  services: Array<{ name?: string; price?: number }>;
  subtotal?: number;
  deliveryFee?: number;
  total: number;
  status: string;
  completedDate?: string;
  notes?: string;
  garageInfo?: {
    name?: string;
    phone?: string;
    address?: string;
  };
}

export default function SimpleBill({
  trackingId,
  customerName,
  customerEmail,
  customerPhone,
  vehicle,
  serviceDate,
  services,
  subtotal,
  deliveryFee,
  total,
  status,
  completedDate,
  notes,
  garageInfo,
}: SimpleBillProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.getElementById("bill-content");
    if (element) {
      const html = element.innerHTML;
      const printWindow = window.open("", "", "height=600,width=800");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const isCompleted = status.toLowerCase() === "completed";

  return (
    <Card className="shadow-md border border-gray-200">
      <CardHeader className="border-b bg-gray-50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">Service Bill</CardTitle>
              <p className="text-xs text-gray-500 mt-1">Tracking ID: {trackingId}</p>
            </div>
          </div>
          {isCompleted && <Badge className="bg-green-100 text-green-800">COMPLETED</Badge>}
        </div>
      </CardHeader>

      <CardContent id="bill-content" className="pt-6 space-y-6">
        {/* Customer & Garage Info */}
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase mb-2">Bill To</p>
            <p className="font-semibold text-gray-900">{customerName}</p>
            <p className="text-gray-600">{customerEmail}</p>
            {customerPhone && <p className="text-gray-600">{customerPhone}</p>}
          </div>
          {garageInfo && (
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase mb-2">Service Provider</p>
              {garageInfo.name && <p className="font-semibold text-gray-900">{garageInfo.name}</p>}
              {garageInfo.phone && <p className="text-gray-600">{garageInfo.phone}</p>}
              {garageInfo.address && <p className="text-gray-600">{garageInfo.address}</p>}
            </div>
          )}
        </div>

        <hr className="border-gray-200" />

        {/* Service Details */}
        <div className="text-sm">
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Vehicle</p>
              <p className="text-gray-900 font-medium">{vehicle}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Service Date</p>
              <p className="text-gray-900 font-medium">
                {new Date(serviceDate).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {completedDate && (
            <div className="mb-4">
              <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Completed On</p>
              <p className="text-gray-900 font-medium">
                {new Date(completedDate).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>

        <hr className="border-gray-200" />

        {/* Services List */}
        <div className="text-sm">
          <p className="text-gray-500 text-xs font-semibold uppercase mb-3">Services</p>
          <div className="space-y-2 mb-4">
            {services && services.length > 0 ? (
              services.map((service, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-gray-700">{service.name || `Service ${idx + 1}`}</span>
                  <span className="text-gray-900 font-medium">₹{(service.price || 0).toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No services listed</p>
            )}
          </div>

          {/* Subtotal & Fees */}
          <div className="space-y-2 border-t pt-3">
            {subtotal && (
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Subtotal</span>
                <span className="text-gray-900">₹{subtotal.toLocaleString()}</span>
              </div>
            )}
            {deliveryFee && deliveryFee > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Delivery Fee</span>
                <span className="text-gray-900">₹{deliveryFee.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center border-t-2 pt-3 mt-3 font-semibold text-base">
            <span className="text-gray-900">Total Amount</span>
            <span className="text-green-600">₹{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <>
            <hr className="border-gray-200" />
            <div className="text-sm">
              <p className="text-gray-500 text-xs font-semibold uppercase mb-2">Notes</p>
              <p className="text-gray-700 whitespace-pre-wrap">{notes}</p>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="border-t pt-4 mt-6">
          <p className="text-xs text-gray-500 text-center">
            Thank you for your business! This is an automated bill. No signature required.
          </p>
        </div>
      </CardContent>

      {/* Action Buttons */}
      <div className="border-t px-6 py-4 bg-gray-50 flex gap-2 justify-end no-print">
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
          <Download className="w-4 h-4" />
          Download
        </Button>
      </div>
    </Card>
  );
}
