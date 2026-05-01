import { prisma } from "@/lib/prisma";

export function generateInvoiceNumber(prefix: string, year: number, sequence: number): string {
  const seq = String(sequence).padStart(4, "0");
  return `${prefix}-${year}-${seq}`;
}

export async function getNextInvoiceNumber(userId: string, prefix: string): Promise<string> {
  const year = new Date().getFullYear();
  const yearPattern = `${prefix}-${year}-`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      userId,
      invoiceNumber: { startsWith: yearPattern },
    },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let nextSeq = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  return generateInvoiceNumber(prefix, year, nextSeq);
}