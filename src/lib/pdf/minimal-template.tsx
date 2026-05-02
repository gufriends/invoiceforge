import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceWithRelations } from "@/types/invoice";
import type { Company } from "@/types/company";
import { pdfFormatCurrency, pdfFormatDate } from "./utils";
import { INVOICE_STATUS_LABELS, RECURRING_CYCLE_LABELS } from "@/lib/constants";
import { PdfLogo, PageNumber, PDF_COLORS } from "./shared";

function createStyles(brand: string) {
  return StyleSheet.create({
    page: { padding: 56, fontSize: 10, fontFamily: "Helvetica", color: PDF_COLORS.foreground, backgroundColor: PDF_COLORS.white },
    // Header
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
    brandName: { fontSize: 15, fontFamily: "Helvetica-Bold", color: PDF_COLORS.foreground },
    brandSub: { fontSize: 8, color: PDF_COLORS.muted, marginTop: 2 },
    invoiceBlock: { textAlign: "right" },
    invoiceLabel: { fontSize: 7, color: PDF_COLORS.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 },
    invoiceNumber: { fontSize: 16, fontFamily: "Helvetica-Bold", color: brand },
    headerDivider: { borderTopWidth: 2, borderColor: brand, marginBottom: 24 },
    // Status badge
    statusBadge: { fontSize: 7, color: brand, borderWidth: 1, borderColor: brand, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 2, alignSelf: "flex-start", marginTop: 3 },
    // Info row (client + dates)
    infoRow: { flexDirection: "row", gap: 32, marginBottom: 28 },
    infoBlock: { flex: 1 },
    infoLabel: { fontSize: 7, color: PDF_COLORS.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5 },
    infoName: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 2 },
    infoText: { fontSize: 8, color: PDF_COLORS.muted, marginBottom: 1, lineHeight: 1.5 },
    infoNpwp: { fontSize: 8, color: PDF_COLORS.foreground, marginTop: 2 },
    // Table — no outer border, hairline rows
    table: { marginBottom: 20 },
    tableHeaderRow: { flexDirection: "row", paddingBottom: 6, borderBottomWidth: 1, borderColor: PDF_COLORS.foreground },
    tableHeaderText: { fontSize: 7, color: PDF_COLORS.muted, textTransform: "uppercase", letterSpacing: 1 },
    tableRow: { flexDirection: "row", paddingVertical: 9, borderBottomWidth: 1, borderColor: PDF_COLORS.border },
    colNo: { width: 20 },
    colItem: { flex: 3.5 },
    colQty: { flex: 0.8, textAlign: "right" },
    colPrice: { flex: 1.6, textAlign: "right" },
    colTotal: { flex: 1.6, textAlign: "right" },
    itemName: { fontSize: 9, marginBottom: 1 },
    itemDesc: { fontSize: 7.5, color: PDF_COLORS.muted },
    // Totals — inline right-aligned
    totalsSection: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 },
    totalsInner: { width: 210 },
    totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    totalsLabel: { fontSize: 8.5, color: PDF_COLORS.muted },
    totalsValue: { fontSize: 8.5 },
    totalsDivider: { borderTopWidth: 1, borderColor: PDF_COLORS.border, marginVertical: 5 },
    grandLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: brand },
    grandValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: brand },
    paidLabel: { fontSize: 8.5, color: "#15803d" },
    paidValue: { fontSize: 8.5, color: "#15803d" },
    remainLabel: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#b45309" },
    remainValue: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#b45309" },
    // Bottom info
    bottomRow: { flexDirection: "row", gap: 16, marginTop: 4 },
    bottomCol: { flex: 1 },
    bottomLabel: { fontSize: 7, color: PDF_COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
    bottomText: { fontSize: 8, color: PDF_COLORS.foreground, lineHeight: 1.6 },
    bottomNotes: { fontSize: 8, color: PDF_COLORS.muted, fontStyle: "italic", lineHeight: 1.6 },
    recurringBadge: { fontSize: 7.5, color: "#15803d", borderWidth: 1, borderColor: "#bbf7d0", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 2, alignSelf: "flex-start", marginBottom: 10 },
    footer: { position: "absolute", bottom: 30, left: 56, right: 56, borderTopWidth: 1, borderColor: PDF_COLORS.border, paddingTop: 7, flexDirection: "row", justifyContent: "space-between" },
    footerText: { fontSize: 7, color: PDF_COLORS.muted },
  });
}

export function MinimalInvoicePDF({
  invoice,
  company,
}: {
  invoice: InvoiceWithRelations;
  company: Company;
}) {
  const brand = company.primaryColor || "#2563eb";
  const styles = createStyles(brand);
  const currency = company.currency as any;
  const paidAmount = invoice.paidAmount ?? 0;
  const remaining = invoice.total - paidAmount;
  const hasPartialPayment = paidAmount > 0 && paidAmount < invoice.total;
  const isPaid = paidAmount >= invoice.total;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {company.logo ? (
              <PdfLogo src={company.logo} width={80} />
            ) : (
              <Text style={styles.brandName}>{company.name}</Text>
            )}
            {company.email && <Text style={styles.brandSub}>{company.email}</Text>}
          </View>
          <View style={styles.invoiceBlock}>
            <Text style={styles.invoiceLabel}>Invoice</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.statusBadge}>{INVOICE_STATUS_LABELS[invoice.status]}</Text>
          </View>
        </View>
        <View style={styles.headerDivider} />

        {/* Client + Dates row */}
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Kepada</Text>
            <Text style={styles.infoName}>{invoice.client.name}</Text>
            {invoice.client.company && <Text style={styles.infoText}>{invoice.client.company}</Text>}
            {invoice.client.address && <Text style={styles.infoText}>{invoice.client.address}</Text>}
            <Text style={styles.infoText}>{[invoice.client.city, invoice.client.province].filter(Boolean).join(", ")}</Text>
            <Text style={styles.infoText}>{invoice.client.email}</Text>
            {invoice.client.npwp && <Text style={styles.infoNpwp}>NPWP: {invoice.client.npwp}</Text>}
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Dari</Text>
            <Text style={styles.infoName}>{company.name}</Text>
            {company.address && <Text style={styles.infoText}>{company.address}</Text>}
            <Text style={styles.infoText}>{[company.city, company.province].filter(Boolean).join(", ")}</Text>
            {company.npwp && <Text style={styles.infoNpwp}>NPWP: {company.npwp}</Text>}
          </View>
          <View style={[styles.infoBlock, { flex: 0.7 }]}>
            <Text style={styles.infoLabel}>Tanggal</Text>
            <Text style={{ fontSize: 9, marginBottom: 10 }}>{pdfFormatDate(invoice.issueDate)}</Text>
            <Text style={styles.infoLabel}>Jatuh Tempo</Text>
            <Text style={{ fontSize: 9 }}>{pdfFormatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderText, styles.colNo]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.colItem]}>Item</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Harga</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>
          {invoice.items.map((it, idx) => (
            <View key={it.id} style={styles.tableRow}>
              <Text style={[{ fontSize: 8.5, color: PDF_COLORS.muted }, styles.colNo]}>{idx + 1}</Text>
              <View style={styles.colItem}>
                <Text style={styles.itemName}>{it.name}</Text>
                {it.description && <Text style={styles.itemDesc}>{it.description}</Text>}
              </View>
              <Text style={[{ fontSize: 8.5 }, styles.colQty]}>{it.quantity}</Text>
              <Text style={[{ fontSize: 8.5 }, styles.colPrice]}>{pdfFormatCurrency(it.unitPrice, currency)}</Text>
              <Text style={[{ fontSize: 8.5 }, styles.colTotal]}>{pdfFormatCurrency(it.total, currency)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsInner}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{pdfFormatCurrency(invoice.subtotal, currency)}</Text>
            </View>
            {invoice.discountAmount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Diskon</Text>
                <Text style={styles.totalsValue}>- {pdfFormatCurrency(invoice.discountAmount, currency)}</Text>
              </View>
            )}
            {invoice.taxRate > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>PPN ({invoice.taxRate}%)</Text>
                <Text style={styles.totalsValue}>{pdfFormatCurrency(invoice.taxAmount, currency)}</Text>
              </View>
            )}
            <View style={styles.totalsDivider} />
            <View style={styles.totalsRow}>
              <Text style={styles.grandLabel}>Total</Text>
              <Text style={styles.grandValue}>{pdfFormatCurrency(invoice.total, currency)}</Text>
            </View>
            {(hasPartialPayment || isPaid) && (
              <>
                <View style={styles.totalsDivider} />
                <View style={styles.totalsRow}>
                  <Text style={styles.paidLabel}>Sudah Dibayar</Text>
                  <Text style={styles.paidValue}>{pdfFormatCurrency(paidAmount, currency)}</Text>
                </View>
                {!isPaid && (
                  <View style={styles.totalsRow}>
                    <Text style={styles.remainLabel}>Sisa Tagihan</Text>
                    <Text style={styles.remainValue}>{pdfFormatCurrency(remaining, currency)}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Recurring badge */}
        {invoice.isRecurring && invoice.recurringCycle && (
          <Text style={styles.recurringBadge}>
            Berulang setiap {RECURRING_CYCLE_LABELS[invoice.recurringCycle]}
          </Text>
        )}

        {/* Bank / Notes / Terms */}
        <View style={styles.bottomRow}>
          {company.bankAccount && (
            <View style={styles.bottomCol}>
              <Text style={styles.bottomLabel}>Pembayaran</Text>
              <Text style={styles.bottomText}>{company.bankName}</Text>
              <Text style={styles.bottomText}>{company.bankAccount}</Text>
              <Text style={styles.bottomText}>a.n. {company.bankHolder}</Text>
            </View>
          )}
          {invoice.notes && (
            <View style={styles.bottomCol}>
              <Text style={styles.bottomLabel}>Catatan</Text>
              <Text style={styles.bottomNotes}>{invoice.notes}</Text>
            </View>
          )}
          {invoice.terms && (
            <View style={styles.bottomCol}>
              <Text style={styles.bottomLabel}>Syarat & Ketentuan</Text>
              <Text style={styles.bottomNotes}>{invoice.terms}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{company.name} · {company.email ?? ""}</Text>
          <Text style={styles.footerText}>{invoice.invoiceNumber}</Text>
        </View>
        <PageNumber />
      </Page>
    </Document>
  );
}
