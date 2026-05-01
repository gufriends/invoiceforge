import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceWithRelations } from "@/types/invoice";
import type { Company } from "@/types/company";
import { pdfFormatCurrency, pdfFormatDate } from "./utils";

const styles = StyleSheet.create({
  page: { padding: 60, fontSize: 10, fontFamily: "Helvetica", color: "#1e293b" },
  topRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 50 },
  brand: { fontSize: 16, fontWeight: 700 },
  num: { textAlign: "right" },
  numLabel: { fontSize: 8, color: "#94a3b8", letterSpacing: 1 },
  numValue: { fontSize: 18, fontWeight: 700 },
  block: { marginBottom: 30 },
  small: { fontSize: 8, color: "#94a3b8", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" },
  table: { marginBottom: 20 },
  th: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderColor: "#1e293b" },
  td: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderColor: "#e2e8f0" },
  colItem: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 2, textAlign: "right" },
  colTotal: { flex: 2, textAlign: "right" },
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 4 },
  totalsLabel: { width: 120, textAlign: "right", marginRight: 10 },
  totalsValue: { width: 120, textAlign: "right" },
  grand: { fontSize: 14, fontWeight: 700, marginTop: 8 },
});

export function MinimalInvoicePDF({ invoice, company }: { invoice: InvoiceWithRelations; company: Company }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.brand}>{company.name}</Text>
            {company.email && <Text style={{ fontSize: 9, color: "#64748b" }}>{company.email}</Text>}
          </View>
          <View style={styles.num}>
            <Text style={styles.numLabel}>INVOICE</Text>
            <Text style={styles.numValue}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        <View style={[styles.block, { flexDirection: "row", gap: 40 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.small}>Untuk</Text>
            <Text style={{ fontWeight: 700 }}>{invoice.client.name}</Text>
            {invoice.client.company && <Text>{invoice.client.company}</Text>}
            <Text style={{ fontSize: 9, color: "#64748b" }}>{invoice.client.email}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.small}>Tanggal</Text>
            <Text>{pdfFormatDate(invoice.issueDate)}</Text>
            <Text style={[styles.small, { marginTop: 8 }]}>Jatuh Tempo</Text>
            <Text>{pdfFormatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={[styles.small, styles.colItem]}>Item</Text>
            <Text style={[styles.small, styles.colQty]}>Qty</Text>
            <Text style={[styles.small, styles.colPrice]}>Harga</Text>
            <Text style={[styles.small, styles.colTotal]}>Total</Text>
          </View>
          {invoice.items.map((it) => (
            <View key={it.id} style={styles.td}>
              <View style={styles.colItem}>
                <Text>{it.name}</Text>
                {it.description && <Text style={{ fontSize: 8, color: "#94a3b8" }}>{it.description}</Text>}
              </View>
              <Text style={styles.colQty}>{it.quantity}</Text>
              <Text style={styles.colPrice}>{pdfFormatCurrency(it.unitPrice, company.currency as any)}</Text>
              <Text style={styles.colTotal}>{pdfFormatCurrency(it.total, company.currency as any)}</Text>
            </View>
          ))}
        </View>

        <View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{pdfFormatCurrency(invoice.subtotal, company.currency as any)}</Text>
          </View>
          {invoice.discountAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Diskon</Text>
              <Text style={styles.totalsValue}>- {pdfFormatCurrency(invoice.discountAmount, company.currency as any)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>PPN {invoice.taxRate}%</Text>
            <Text style={styles.totalsValue}>{pdfFormatCurrency(invoice.taxAmount, company.currency as any)}</Text>
          </View>
          <View style={[styles.totalsRow, styles.grand]}>
            <Text style={styles.totalsLabel}>Total</Text>
            <Text style={styles.totalsValue}>{pdfFormatCurrency(invoice.total, company.currency as any)}</Text>
          </View>
        </View>

        {company.bankAccount && (
          <View style={{ marginTop: 40 }}>
            <Text style={styles.small}>Pembayaran ke</Text>
            <Text>{company.bankName} · {company.bankAccount}</Text>
            <Text style={{ fontSize: 9 }}>a.n. {company.bankHolder}</Text>
          </View>
        )}

        {invoice.notes && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.small}>Catatan</Text>
            <Text style={{ fontSize: 9 }}>{invoice.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}