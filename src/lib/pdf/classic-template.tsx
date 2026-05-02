import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceWithRelations } from "@/types/invoice";
import type { Company } from "@/types/company";
import { pdfFormatCurrency, pdfFormatDate } from "./utils";
import { INVOICE_STATUS_LABELS, RECURRING_CYCLE_LABELS } from "@/lib/constants";
import { PdfLogo, PageNumber, PDF_COLORS } from "./shared";

function createStyles(brand: string) {
  return StyleSheet.create({
    page: { padding: 50, fontSize: 10, fontFamily: "Times-Roman", color: PDF_COLORS.foreground, backgroundColor: PDF_COLORS.white },
    // Header — center logo/name + double divider
    headerCenter: { alignItems: "center", marginBottom: 8 },
    companyName: { fontSize: 16, fontFamily: "Times-Bold", marginBottom: 2, textAlign: "center" },
    companyAddress: { fontSize: 8, color: PDF_COLORS.muted, textAlign: "center", lineHeight: 1.5 },
    dividerDouble: { borderTopWidth: 2, borderBottomWidth: 1, borderColor: brand, marginTop: 12, marginBottom: 4, height: 4 },
    // Title block
    titleBlock: { alignItems: "center", marginBottom: 16 },
    invoiceTitle: { fontSize: 20, fontFamily: "Times-Bold", letterSpacing: 4, color: brand, marginBottom: 4 },
    invoiceNumber: { fontSize: 11, fontFamily: "Times-Bold", marginBottom: 6 },
    statusBadge: { fontSize: 8, backgroundColor: brand, color: "#fff", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 2 },
    // Date row
    dateRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16, paddingHorizontal: 4 },
    dateLabel: { fontSize: 9, color: PDF_COLORS.muted },
    dateValue: { fontSize: 9, fontFamily: "Times-Bold" },
    // Parties
    partiesRow: { flexDirection: "row", gap: 16, marginBottom: 20 },
    partyBox: { flex: 1, borderWidth: 1, borderColor: PDF_COLORS.border, padding: 10 },
    partyLabel: { fontSize: 7, fontFamily: "Times-Bold", color: PDF_COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
    partyName: { fontSize: 12, fontFamily: "Times-Bold", marginBottom: 2 },
    partyDetail: { fontSize: 8, color: PDF_COLORS.muted, marginBottom: 1 },
    partyNpwp: { fontSize: 8, color: PDF_COLORS.foreground, marginTop: 3 },
    // Table with full borders
    table: { borderWidth: 1, borderColor: brand, marginBottom: 16 },
    tableHeader: { flexDirection: "row", backgroundColor: brand, paddingVertical: 7, paddingHorizontal: 8 },
    tableHeaderText: { fontSize: 8, fontFamily: "Times-Bold", color: "#fff" },
    tableRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 8, borderTopWidth: 1, borderColor: PDF_COLORS.border },
    colNo: { width: 22 },
    colItem: { flex: 3 },
    colQty: { flex: 1, textAlign: "right" },
    colPrice: { flex: 1.5, textAlign: "right" },
    colTotal: { flex: 1.5, textAlign: "right" },
    itemName: { fontSize: 9, fontFamily: "Times-Bold", marginBottom: 1 },
    itemDesc: { fontSize: 8, color: PDF_COLORS.muted },
    // Totals
    totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 16 },
    totalsBox: { width: 230, borderWidth: 1, borderColor: PDF_COLORS.border, padding: 10 },
    totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    totalsLabel: { fontSize: 9, color: PDF_COLORS.muted },
    totalsValue: { fontSize: 9 },
    totalsDivider: { borderTopWidth: 1, borderColor: brand, marginVertical: 6 },
    totalsGrandLabel: { fontSize: 12, fontFamily: "Times-Bold", color: brand },
    totalsGrandValue: { fontSize: 12, fontFamily: "Times-Bold", color: brand },
    paidLabel: { fontSize: 9, color: "#15803d" },
    paidValue: { fontSize: 9, color: "#15803d" },
    remainLabel: { fontSize: 9, fontFamily: "Times-Bold", color: "#b45309" },
    remainValue: { fontSize: 9, fontFamily: "Times-Bold", color: "#b45309" },
    // Info bottom
    infoRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
    infoCol: { flex: 1 },
    infoLabel: { fontSize: 7, fontFamily: "Times-Bold", color: PDF_COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
    infoText: { fontSize: 8, lineHeight: 1.5 },
    recurringBadge: { fontSize: 8, backgroundColor: "#dcfce7", color: "#15803d", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2, alignSelf: "flex-start", marginBottom: 10 },
    // Signature
    signature: { marginTop: 36, flexDirection: "row", justifyContent: "space-between" },
    signBlock: { textAlign: "center", width: 190 },
    signLine: { borderTopWidth: 1, borderColor: PDF_COLORS.foreground, marginTop: 44, marginBottom: 4 },
    signName: { fontSize: 9, fontFamily: "Times-Bold" },
    footer: { position: "absolute", bottom: 30, left: 50, right: 50, borderTopWidth: 1, borderColor: PDF_COLORS.border, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
    footerText: { fontSize: 7, color: PDF_COLORS.muted },
  });
}

export function ClassicInvoicePDF({
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
        <View style={styles.headerCenter}>
          {company.logo ? (
            <PdfLogo src={company.logo} width={100} />
          ) : (
            <Text style={styles.companyName}>{company.name}</Text>
          )}
          <Text style={styles.companyAddress}>
            {[company.address, company.city, company.province, company.postalCode].filter(Boolean).join(", ")}
            {company.phone ? `  ·  Telp: ${company.phone}` : ""}
            {company.email ? `  ·  ${company.email}` : ""}
            {company.npwp ? `\nNPWP: ${company.npwp}` : ""}
          </Text>
        </View>
        <View style={styles.dividerDouble} />

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <Text style={styles.statusBadge}>{INVOICE_STATUS_LABELS[invoice.status]}</Text>
        </View>

        {/* Dates */}
        <View style={styles.dateRow}>
          <View>
            <Text style={styles.dateLabel}>Tanggal Terbit</Text>
            <Text style={styles.dateValue}>{pdfFormatDate(invoice.issueDate)}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.dateLabel}>Jatuh Tempo</Text>
            <Text style={styles.dateValue}>{pdfFormatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.partiesRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Dari</Text>
            <Text style={styles.partyName}>{company.name}</Text>
            {company.address && <Text style={styles.partyDetail}>{company.address}</Text>}
            <Text style={styles.partyDetail}>{[company.city, company.province].filter(Boolean).join(", ")}</Text>
            {company.phone && <Text style={styles.partyDetail}>Telp: {company.phone}</Text>}
            {company.email && <Text style={styles.partyDetail}>{company.email}</Text>}
            {company.npwp && <Text style={styles.partyNpwp}>NPWP: {company.npwp}</Text>}
          </View>
          <View style={styles.partyBox}>
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
            <Text style={[styles.tableHeaderText, styles.colItem]}>Deskripsi</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Harga</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Subtotal</Text>
          </View>
          {invoice.items.map((it, idx) => (
            <View key={it.id} style={styles.tableRow}>
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

        {/* Recurring + Info */}
        {invoice.isRecurring && invoice.recurringCycle && (
          <Text style={styles.recurringBadge}>
            Berulang setiap {RECURRING_CYCLE_LABELS[invoice.recurringCycle]}
          </Text>
        )}
        <View style={styles.infoRow}>
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

        {/* Signature */}
        <View style={styles.signature}>
          <View style={styles.signBlock}>
            <Text style={{ fontSize: 9 }}>Hormat kami,</Text>
            <View style={styles.signLine} />
            <Text style={styles.signName}>{company.name}</Text>
          </View>
          <View style={styles.signBlock}>
            <Text style={{ fontSize: 9 }}>Diterima oleh,</Text>
            <View style={styles.signLine} />
            <Text style={styles.signName}>{invoice.client.name}</Text>
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
