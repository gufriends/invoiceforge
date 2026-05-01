import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceWithRelations } from "@/types/invoice";
import type { Company } from "@/types/company";
import { pdfFormatCurrency, pdfFormatDate } from "./utils";
import { INVOICE_STATUS_LABELS } from "@/lib/constants";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#0f172a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  brand: { fontSize: 28, fontWeight: 700, color: "#2563eb" },
  invoiceMeta: { textAlign: "right" },
  metaRow: { fontSize: 9, marginBottom: 2 },
  invoiceNumber: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  section: { marginBottom: 20 },
  twoCol: { flexDirection: "row", gap: 30 },
  col: { flex: 1 },
  label: { fontSize: 8, color: "#64748b", textTransform: "uppercase", marginBottom: 4 },
  value: { fontSize: 10, marginBottom: 2 },
  bold: { fontWeight: 700 },
  table: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f1f5f9", padding: 8, fontWeight: 700, fontSize: 9 },
  tableRow: { flexDirection: "row", padding: 8, borderTopWidth: 1, borderColor: "#e2e8f0" },
  colItem: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  totals: { marginLeft: "auto", width: 220, marginTop: 16 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalsBold: { fontWeight: 700, fontSize: 12, color: "#2563eb", borderTopWidth: 1, borderColor: "#0f172a", paddingTop: 6 },
  notes: { marginTop: 20, padding: 12, backgroundColor: "#f8fafc", borderRadius: 4 },
  footer: { marginTop: 30, paddingTop: 12, borderTopWidth: 1, borderColor: "#e2e8f0", fontSize: 8, color: "#64748b" },
});

export function ModernInvoicePDF({ invoice, company }: { invoice: InvoiceWithRelations; company: Company }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>INVOICE</Text>
            <Text style={[styles.value, { marginTop: 6, fontWeight: 700 }]}>{company.name}</Text>
            {company.address && <Text style={styles.value}>{company.address}</Text>}
            <Text style={styles.value}>
              {[company.city, company.province, company.postalCode].filter(Boolean).join(", ")}
            </Text>
            {company.phone && <Text style={styles.value}>Telp: {company.phone}</Text>}
            {company.email && <Text style={styles.value}>Email: {company.email}</Text>}
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.metaRow}>Status: {INVOICE_STATUS_LABELS[invoice.status]}</Text>
            <Text style={styles.metaRow}>Tanggal: {pdfFormatDate(invoice.issueDate)}</Text>
            <Text style={styles.metaRow}>Jatuh Tempo: {pdfFormatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>DITAGIHKAN KEPADA</Text>
          <Text style={[styles.value, styles.bold]}>{invoice.client.name}</Text>
          {invoice.client.company && <Text style={styles.value}>{invoice.client.company}</Text>}
          {invoice.client.address && <Text style={styles.value}>{invoice.client.address}</Text>}
          <Text style={styles.value}>{[invoice.client.city, invoice.client.province].filter(Boolean).join(", ")}</Text>
          <Text style={styles.value}>{invoice.client.email}</Text>
          {invoice.client.npwp && <Text style={styles.value}>NPWP: {invoice.client.npwp}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colItem}>Item</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Harga</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {invoice.items.map((it) => (
            <View key={it.id} style={styles.tableRow}>
              <View style={styles.colItem}>
                <Text style={styles.bold}>{it.name}</Text>
                {it.description && <Text style={{ fontSize: 8, color: "#64748b" }}>{it.description}</Text>}
              </View>
              <Text style={styles.colQty}>{it.quantity}</Text>
              <Text style={styles.colPrice}>{pdfFormatCurrency(it.unitPrice, company.currency as any)}</Text>
              <Text style={styles.colTotal}>{pdfFormatCurrency(it.total, company.currency as any)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{pdfFormatCurrency(invoice.subtotal, company.currency as any)}</Text>
          </View>
          {invoice.discountAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text>Diskon</Text>
              <Text>- {pdfFormatCurrency(invoice.discountAmount, company.currency as any)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text>PPN ({invoice.taxRate}%)</Text>
            <Text>{pdfFormatCurrency(invoice.taxAmount, company.currency as any)}</Text>
          </View>
          <View style={[styles.totalsRow, styles.totalsBold]}>
            <Text>TOTAL</Text>
            <Text>{pdfFormatCurrency(invoice.total, company.currency as any)}</Text>
          </View>
        </View>

        {(invoice.notes || invoice.terms || company.bankAccount) && (
          <View style={styles.notes}>
            {company.bankAccount && (
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.label}>METODE PEMBAYARAN</Text>
                <Text style={styles.value}>{company.bankName} · {company.bankAccount}</Text>
                <Text style={styles.value}>a.n. {company.bankHolder}</Text>
              </View>
            )}
            {invoice.notes && (
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.label}>CATATAN</Text>
                <Text style={styles.value}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.terms && (
              <View>
                <Text style={styles.label}>SYARAT & KETENTUAN</Text>
                <Text style={styles.value}>{invoice.terms}</Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.footer}>Dokumen ini dihasilkan oleh InvoiceForge.</Text>
      </Page>
    </Document>
  );
}