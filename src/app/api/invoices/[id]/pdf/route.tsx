import { renderToBuffer } from "@react-pdf/renderer";
import { handleApiError, requireAuth } from "@/lib/api-utils";
import { invoiceService } from "@/services/invoice.service";
import { companyService } from "@/services/company.service";
import { ModernInvoicePDF } from "@/lib/pdf/modern-template";
import { ClassicInvoicePDF } from "@/lib/pdf/classic-template";
import { MinimalInvoicePDF } from "@/lib/pdf/minimal-template";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const [invoice, company] = await Promise.all([
      invoiceService.getById(userId, id),
      companyService.get(userId),
    ]);

    const pdfDoc = (() => {
      switch (invoice.template) {
        case "classic": return <ClassicInvoicePDF invoice={invoice as any} company={company as any} />;
        case "minimal": return <MinimalInvoicePDF invoice={invoice as any} company={company as any} />;
        default: return <ModernInvoicePDF invoice={invoice as any} company={company as any} />;
      }
    })();

    const buffer = await renderToBuffer(pdfDoc);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}