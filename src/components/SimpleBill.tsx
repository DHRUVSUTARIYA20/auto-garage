import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer } from "lucide-react";
import { jsPDF } from "jspdf";

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
  paymentStatus?: "paid" | "unpaid";
  paymentMethod?: string;
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
  paymentStatus,
  paymentMethod,
  completedDate,
  notes,
  garageInfo,
}: SimpleBillProps) {
  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  const normalizedServices = Array.isArray(services) ? services : [];
  const computedSubtotal =
    typeof subtotal === "number"
      ? subtotal
      : normalizedServices.reduce((sum, service) => sum + Number(service.price || 0), 0);
  const computedDeliveryFee = Number(deliveryFee || 0);
  const taxAmount = 0;
  const grandTotal = Number(total || computedSubtotal + computedDeliveryFee + taxAmount);

  const billDate = new Date(serviceDate || Date.now());
  const completedAt = completedDate ? new Date(completedDate) : null;
  const invoiceNumber = `INV-${String(trackingId).toUpperCase()}`;
  const normalizedPaymentStatus = paymentStatus === "paid" ? "Paid" : "Unpaid";

  const formatDateTime = (value: Date) =>
    value.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const buildPrintHtml = () => {
    const rows = normalizedServices
      .map((service, index) => {
        const name = service?.name || `Service ${index + 1}`;
        const price = Number(service?.price || 0);
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${name}</td>
            <td style="text-align:right">${currency.format(price)}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${invoiceNumber}</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 0; padding: 24px; background: #f9fafb; }
            .sheet { max-width: 820px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
            .head { padding: 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; gap: 16px; }
            .title { font-size: 22px; font-weight: 700; margin: 0 0 6px; }
            .muted { color: #6b7280; font-size: 12px; }
            .status { display: inline-block; font-size: 11px; font-weight: 700; border-radius: 9999px; padding: 4px 10px; background: #dcfce7; color: #166534; }
            .status.unpaid { background: #fef3c7; color: #92400e; }
            .grid { padding: 20px 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .label { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; }
            .value { font-size: 14px; color: #111827; margin: 2px 0; }
            table { width: calc(100% - 48px); margin: 0 24px 16px; border-collapse: collapse; }
            thead th { text-align: left; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: #6b7280; padding: 10px 8px; border-bottom: 1px solid #e5e7eb; }
            tbody td { padding: 10px 8px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
            .totals { margin: 0 24px 24px auto; width: 320px; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
            .row { display: flex; justify-content: space-between; padding: 10px 14px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
            .row.total { background: #f8fafc; font-size: 16px; font-weight: 700; }
            .notes { margin: 0 24px 24px; font-size: 13px; color: #374151; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
            .foot { border-top: 1px solid #e5e7eb; padding: 16px 24px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <section class="sheet">
            <header class="head">
              <div>
                <h1 class="title">Tax Invoice</h1>
                <div class="muted">Invoice No: ${invoiceNumber}</div>
                <div class="muted">Tracking ID: ${trackingId}</div>
              </div>
              <div style="text-align:right">
                <span class="status ${normalizedPaymentStatus === "Paid" ? "" : "unpaid"}">${normalizedPaymentStatus}</span>
                <div class="muted" style="margin-top:8px">Bill Date: ${formatDateTime(billDate)}</div>
                ${completedAt ? `<div class="muted">Completed: ${formatDateTime(completedAt)}</div>` : ""}
                ${paymentMethod ? `<div class="muted">Method: ${paymentMethod.toUpperCase()}</div>` : ""}
              </div>
            </header>

            <section class="grid">
              <div>
                <div class="label">Bill To</div>
                <div class="value"><strong>${customerName}</strong></div>
                <div class="value">${customerEmail}</div>
                ${customerPhone ? `<div class="value">${customerPhone}</div>` : ""}
                <div class="value" style="margin-top:8px">Vehicle: ${vehicle}</div>
              </div>
              <div>
                <div class="label">Service Provider</div>
                <div class="value"><strong>${garageInfo?.name || "Auto Garage"}</strong></div>
                ${garageInfo?.phone ? `<div class="value">${garageInfo.phone}</div>` : ""}
                ${garageInfo?.address ? `<div class="value">${garageInfo.address}</div>` : ""}
              </div>
            </section>

            <table>
              <thead>
                <tr>
                  <th style="width:50px">#</th>
                  <th>Description</th>
                  <th style="text-align:right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${rows || '<tr><td>1</td><td>General Service</td><td style="text-align:right">₹0</td></tr>'}
              </tbody>
            </table>

            <section class="totals">
              <div class="row"><span>Subtotal</span><span>${currency.format(computedSubtotal)}</span></div>
              <div class="row"><span>Delivery</span><span>${currency.format(computedDeliveryFee)}</span></div>
              <div class="row"><span>Tax</span><span>${currency.format(taxAmount)}</span></div>
              <div class="row total"><span>Total</span><span>${currency.format(grandTotal)}</span></div>
            </section>

            ${notes ? `<section class="notes"><strong>Notes:</strong><br/>${String(notes).replace(/\n/g, "<br/>")}</section>` : ""}

            <footer class="foot">
              This is a system-generated invoice and does not require a physical signature.
            </footer>
          </section>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=1024,height=768");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(buildPrintHtml());
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownload = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const left = 44;
    const right = 551;
    let y = 46;

    const line = (offset = 14) => {
      y += offset;
      return y;
    };

    // Keep PDF amounts ASCII-only to avoid glyph issues for currency symbols
    // in built-in jsPDF fonts on some devices/viewers.
    const money = (amount: number) => `INR ${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Tax Invoice", left, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Invoice No: ${invoiceNumber}`, left, line());
    doc.text(`Tracking ID: ${trackingId}`, left, line());
    doc.text(`Bill Date: ${formatDateTime(billDate)}`, left, line());

    doc.setFont("helvetica", "bold");
    doc.text(`Payment: ${normalizedPaymentStatus}`, 430, 46);
    if (paymentMethod) {
      doc.setFont("helvetica", "normal");
      doc.text(`Method: ${paymentMethod.toUpperCase()}`, 430, 62);
    }

    if (completedAt) {
      doc.setFont("helvetica", "normal");
      doc.text(`Completed: ${formatDateTime(completedAt)}`, 430, 78);
    }

    y = 116;
    doc.setDrawColor(220, 220, 220);
    doc.line(left, y, right, y);

    y = 140;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Bill To", left, y);
    doc.text("Service Provider", 300, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(customerName, left, line(16));
    doc.text(customerEmail, left, line());
    if (customerPhone) {
      doc.text(customerPhone, left, line());
    }
    doc.text(`Vehicle: ${vehicle}`, left, line());

    let providerY = 156;
    doc.text(garageInfo?.name || "Auto Garage", 300, providerY);
    providerY += 14;
    if (garageInfo?.phone) {
      doc.text(garageInfo.phone, 300, providerY);
      providerY += 14;
    }
    if (garageInfo?.address) {
      const addressLines = doc.splitTextToSize(garageInfo.address, 240);
      doc.text(addressLines, 300, providerY);
      providerY += addressLines.length * 14;
    }

    y = Math.max(y + 22, providerY + 14);
    doc.line(left, y, right, y);

    y += 18;
    doc.setFont("helvetica", "bold");
    doc.text("#", left, y);
    doc.text("Description", left + 26, y);
    doc.text("Amount", right, y, { align: "right" });

    y += 8;
    doc.line(left, y, right, y);

    doc.setFont("helvetica", "normal");
    const pdfServices = normalizedServices.length > 0 ? normalizedServices : [{ name: "General Service", price: 0 }];

    pdfServices.forEach((service, index) => {
      y += 18;
      if (y > 720) {
        doc.addPage();
        y = 56;
      }
      doc.text(String(index + 1), left, y);
      doc.text(service.name || `Service ${index + 1}`, left + 26, y);
      doc.text(money(Number(service.price || 0)), right, y, { align: "right" });
    });

    y += 20;
    doc.line(340, y, right, y);

    y += 16;
    doc.text("Subtotal", 340, y);
    doc.text(money(computedSubtotal), right, y, { align: "right" });

    y += 16;
    doc.text("Delivery Fee", 340, y);
    doc.text(money(computedDeliveryFee), right, y, { align: "right" });

    y += 16;
    doc.text("Tax", 340, y);
    doc.text(money(taxAmount), right, y, { align: "right" });

    y += 16;
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total", 340, y);
    doc.text(money(grandTotal), right, y, { align: "right" });

    if (notes) {
      y += 24;
      doc.setFont("helvetica", "bold");
      doc.text("Notes", left, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      const noteLines = doc.splitTextToSize(String(notes), right - left);
      doc.text(noteLines, left, y);
      y += noteLines.length * 12;
    }

    y += 22;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text("This is a computer-generated invoice and is valid without signature or stamp.", left, y);

    doc.save(`${invoiceNumber}.pdf`);
  };

  const isCompleted = status.toLowerCase() === "completed";

  return (
    <Card className="shadow-xl border-slate-200 bg-white text-slate-900">
      <CardHeader className="border-b bg-white pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-700" />
            <div>
              <CardTitle className="text-lg text-slate-900">Tax Invoice</CardTitle>
              <p className="text-xs text-slate-500 mt-1">Invoice No: {invoiceNumber}</p>
            </div>
          </div>
          <Badge className={normalizedPaymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
            {normalizedPaymentStatus}
          </Badge>
        </div>
      </CardHeader>

      <CardContent id="bill-content" className="pt-6 space-y-6 bg-white text-slate-900">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg border border-slate-200 p-4 bg-white">
            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-2">Invoice Details</p>
            <p className="text-slate-700">Tracking ID: <span className="font-semibold text-slate-900">{trackingId}</span></p>
            <p className="text-slate-700">Bill Date: <span className="font-semibold text-slate-900">{formatDateTime(billDate)}</span></p>
            {paymentMethod && <p className="text-slate-700">Payment Method: <span className="font-semibold text-slate-900 uppercase">{paymentMethod}</span></p>}
            {completedAt && (
              <p className="text-slate-700">Completed: <span className="font-semibold text-slate-900">{formatDateTime(completedAt)}</span></p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 p-4 bg-white">
            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-2">Service Provider</p>
            <p className="font-semibold text-slate-900">{garageInfo?.name || "Auto Garage"}</p>
            {garageInfo?.phone && <p className="text-slate-700">{garageInfo.phone}</p>}
            {garageInfo?.address && <p className="text-slate-700">{garageInfo.address}</p>}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-2">Bill To</p>
            <p className="font-semibold text-slate-900">{customerName}</p>
            <p className="text-slate-700">{customerEmail}</p>
            {customerPhone && <p className="text-slate-700">{customerPhone}</p>}
          </div>

          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-2">Vehicle & Service</p>
            <p className="text-slate-700">Vehicle: <span className="font-semibold text-slate-900">{vehicle}</span></p>
            <p className="text-slate-700">
              Service Date: <span className="font-semibold text-slate-900">{new Date(serviceDate).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}</span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-wider uppercase text-slate-500 w-14">#</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-wider uppercase text-slate-500">Description</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold tracking-wider uppercase text-slate-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {normalizedServices.length > 0 ? (
                normalizedServices.map((service, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-600">{idx + 1}</td>
                    <td className="px-4 py-3 text-slate-800">{service.name || `Service ${idx + 1}`}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {currency.format(Number(service.price || 0))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-600">1</td>
                  <td className="px-4 py-3 text-slate-500 italic">No services listed</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{currency.format(0)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ml-auto w-full max-w-sm rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 text-sm border-b border-slate-100">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium text-slate-900">{currency.format(computedSubtotal)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 text-sm border-b border-slate-100">
            <span className="text-slate-600">Delivery Fee</span>
            <span className="font-medium text-slate-900">{currency.format(computedDeliveryFee)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 text-sm border-b border-slate-100">
            <span className="text-slate-600">Tax</span>
            <span className="font-medium text-slate-900">{currency.format(taxAmount)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
            <span className="font-semibold text-slate-900">Grand Total</span>
            <span className="font-bold text-lg text-slate-900">{currency.format(grandTotal)}</span>
          </div>
        </div>

        {notes && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-2">Notes</p>
            <p className="text-slate-700 whitespace-pre-wrap">{notes}</p>
          </div>
        )}

        <div className="border-t pt-4 mt-2">
          <p className="text-xs text-slate-500 text-center">
            This is a computer-generated invoice and is valid without signature or stamp.
          </p>
        </div>
      </CardContent>

      <div className="border-t px-6 py-4 bg-white flex gap-2 justify-end no-print">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="gap-2 border-slate-900 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
        >
          <Printer className="w-4 h-4" />
          Print
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-2 border-slate-900 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
        >
          <Download className="w-4 h-4" />
          Download
        </Button>
      </div>
    </Card>
  );
}
