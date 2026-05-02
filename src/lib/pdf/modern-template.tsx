import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceWithRelations } from "@/types/invoice";
import type { Company } from "@/types/company";
import { pdfFormatCurrency, pdfFormatDate } from "./utils";
import { INVOICE_STATUS_LABELS, RECURRING_CYCLE_LABELS } from "@/lib/constants";
import { PdfLogo, PageNumber, PDF_COLORS } from "./shared";

function createStyles(brand: string) {
  return StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: PDF_COLORS.foreground, backgroundColor: PDF_COLORS.white },
    // Header
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
    brandBlock: { flex: 1 },
    brandBar: { width: 36, height: 4, backgroundColor: brand, borderRadius: 2, marginBottom: 10 },
    companyName: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 2 },
    companyAddress: { fontSize: 8, color: PDF_COLORS.muted, lineHeight: 1.5 },
    invoiceMeta: { textAlign: "right" },
    invoiceTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: brand, letterSpacing: 2, marginBottom: 6 },
    invoiceNumber: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 4 },
    metaRow: { fontSize: 8, color: PDF_COLORS.muted, marginBottom: 2 },
    statusBadge: { fontSize: 8, backgroundColor: brand, color: "#fff", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, alignSelf: "flex-end", marginBottom: 6 },
    // Parties
    parties: { flexDirection: "row", gap: 20, marginBottom: 24, padding: 16, backgroundColor: PDF_COLORS.surface, borderRadius: 6 },
    partyCol: { flex: 1 },
    partyLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: PDF_COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
    partyName: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 3 },
    partyDetail: { fontSize: 8, color: PDF_COLORS.muted, marginBottom: 2 },
    partyNpwp: { fontSize: 8, color: PDF_COLORS.foreground, marginTop: 2 },
    divider: { width: 1, backgroundColor: PDF_COLORS.border },
    // Table
    table: { marginBottom: 16 },
    tableHeader: { flexDirection: "row", backgroundColor: brand, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 4 },
    tableHeaderText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#fff" },
    tableRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: PDF_COLORS.border },
    tableRowAlt: { backgroundColor: PDF_COLORS.surface },
    colNo: { width: 24 },
    colItem: { flex: 3 },
    colQty: { flex: 1, textAlign: "right" },
    colPrice: { flex: 1.5, textAlign: "right" },
    colTotal: { flex: 1.5, textAlign: "right" },
    itemName: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 1 },
    itemDesc: { fontSize: 8, color: PDF_COLORS.muted },
    // Totals
    totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 },
    totalsBox: { width: 220, padding: 12, backgroundColor: PDF_COLORS.surface, borderRadius: 6 },
    totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    totalsLabel: { fontSize: 9, color: PDF_COLORS.muted },
    totalsValue: { fontSize: 9 },
    totalsDivider: { borderTopWidth: 1, borderColor: PDF_COLORS.border, marginVertical: 6 },
    totalsGrandLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: brand },
    totalsGrandValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: brand },
    paidRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    paidLabel: { fontSize: 9, color: "#15803d" },
    paidValue: { fontSize: 9, color: "#15803d" },
    remainLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#b45309" },
    remainValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#b45309" },
    // Info
    infoSection: { marginTop: 4 },
    recurringBadge: { fontSize: 8, backgroundColor: "#dcfce7", color: "#15803d", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, alignSelf: "flex-start", marginBottom: 12 },
    infoGrid: { flexDirection: "row", gap: 12 },
    infoCol: { flex: 1, padding: 12, backgroundColor: PDF_COLORS.surface, borderRadius: 6 },
    infoLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: PDF_COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
    infoText: { fontSize: 8, color: PDF_COLORS.foreground, lineHeight: 1.5 },
    footer: { position: "absolute", bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderColor: PDF_COLORS.border, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
    footerText: { fontSize: 7, color: PDF_COLORS.muted },
  });
}

export function ModernInvoicePDF({
  invoice,
  company,
}: {
  invoice: InvoiceWithRelations;
  company: Company;
}) {
  const brand = company.primaryColor || "#10b981";
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
          <View style={styles.brandBlock}>
            {company.logo ? (
              <PdfLogo src={company.logo} width={90} />
            ) : (
              <View>
                <View style={styles.brandBar} />
                <Text style={styles.companyName}>{company.name}</Text>
              </View>
            )}
            <Text style={styles.companyAddress}>
              {[company.address, company.city, company.province, company.postalCode].filter(Boolean).join(", ")}
              {company.phone ? `\nTelp: ${company.phone}` : ""}
              {company.email ? `\nEmail: ${company.email}` : ""}
              {company.npwp ? `\nNPWP: ${company.npwp}` : ""}
            </Text>
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.statusBadge}>{INVOICE_STATUS_LABELS[invoice.status]}</Text>
            <Text style={styles.metaRow}>Tanggal Terbit: {pdfFormatDate(invoice.issueDate)}</Text>
            <Text style={styles.metaRow}>Jatuh Tempo: {pdfFormatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.parties}>
          <View style={styles.partyCol}>
            <Text style={styles.partyLabel}>Dari</Text>
            <Text style={styles.partyName}>{company.name}</Text>
            {company.address && <Text style={styles.partyDetail}>{company.address}</Text>}
            <Text style={styles.partyDetail}>{[company.city, company.province].filter(Boolean).join(", ")}</Text>
            {company.phone && <Text style={styles.partyDetail}>Telp: {company.phone}</Text>}
            {company.email && <Text style={styles.partyDetail}>{company.email}</Text>}
            {company.npwp && <Text style={styles.partyNpwp}>NPWP: {company.npwp}</Text>}
          </View>
          <View style={styles.divider} />
          <View style={styles.partyCol}>
            <Text style={styles.partyLabel}>Kepada</Text>
            <Text style={styles.partyName}>{invoice.client.name}</Text>
            {invoice.client.company && <Text style={styles.partyDetail}>{invoice.client.company}</Text>}
            {invoice.client.address && <Text style={styles.partyDetail}>{invoice.client.address}</Text>}
            <Text style={styles.partyDetail}>{[invoice.client.city, invoice.client.province].filter(Boolean).join(", ")}</Text>
            <Text style={styles.partyDetail}>{invoice.client.email}</Text>
            {invoice.client.npwp && <Text style={styles.partyNpwp}>NPWP: {invoice.client.npwp}</Text>}
          </View>
        </View>

        {/* Items table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colNo]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.colItem]}>Item</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Harga</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>
          {invoice.items.map((it, idx) => (
            <View key={it.id} style={[styles.tableRow, idx % 2 !== 0 ? styles.tableRowAlt : {}]}>
              <Text style={[{ fontSize: 9, color: PDF_COLORS.muted }, styles.colNo]}>{idx + 1}</Text>
              <View style={styles.colItem}>
                <Text style={styles.itemName}>{it.name}</Text>
                {it.description && <Text style={styles.itemDesc}>{it.description}</Text>}
              </View>
              <Text style={[{ fontSize: 9 }, styles.colQty]}>{it.quantity}</Text>
              <Text style={[{ fontSize: 9 }, styles.colPrice]}>{pdfFormatCurrency(it.unitPrice, currency)}</Text>
              <Text style={[{ fontSize: 9 }, styles.colTotal]}>{pdfFormatCurrency(it.total, currency)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsWrap}>
          <View style={styles.totalsBox}>
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
              <Text style={styles.totalsGrandLabel}>TOTAL</Text>
              <Text style={styles.totalsGrandValue}>{pdfFormatCurrency(invoice.total, currency)}</Text>
            </View>
            {(hasPartialPayment || isPaid) && (
              <>
                <View style={styles.totalsDivider} />
                <View style={styles.paidRow}>
                  <Text style={styles.paidLabel}>Sudah Dibayar</Text>
                  <Text style={styles.paidValue}>{pdfFormatCurrency(paidAmount, currency)}</Text>
                </View>
                {!isPaid && (
                  <View style={styles.paidRow}>
                    <Text style={styles.remainLabel}>Sisa Tagihan</Text>
                    <Text style={styles.remainValue}>{pdfFormatCurrency(remaining, currency)}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Info: recurring, notes, terms, bank */}
        <View style={styles.infoSection}>
          {invoice.isRecurring && invoice.recurringCycle && (
            <Text style={styles.recurringBadge}>
              Berulang setiap {RECURRING_CYCLE_LABELS[invoice.recurringCycle]}
            </Text>
          )}
          <View style={styles.infoGrid}>
            {company.bankAccount && (
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Pembayaran</Text>
                <Text style={styles.infoText}>{company.bankName}</Text>
                <Text style={styles.infoText}>{company.bankAccount}</Text>
                <Text style={styles.infoText}>a.n. {company.bankHolder}</Text>
              </View>
            )}
            {invoice.notes && (
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Catatan</Text>
                <Text style={styles.infoText}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.terms && (
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Syarat & Ketentuan</Text>
                <Text style={styles.infoText}>{invoice.terms}</Text>
              </View>
            )}
          </View>
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
