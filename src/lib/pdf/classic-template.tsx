import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceWithRelations } from "@/types/invoice";
import type { Company } from "@/types/company";
import { pdfFormatCurrency, pdfFormatDate } from "./utils";

const styles = StyleSheet.create({
  page: { padding: 50, fontSize: 10, fontFamily: "Times-Roman" },
  title: { textAlign: "center", fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: 4 },
  subtitle: { textAlign: "center", fontSize: 9, marginBottom: 24, color: "#475569" },
  divider: { borderBottomWidth: 2, marginBottom: 16 },
  section: { marginBottom: 16 },
  twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  bold: { fontWeight: 700 },
  table: { borderWidth: 1, borderColor: "#000" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f1f5f9", padding: 8, borderBottomWidth: 1, fontWeight: 700, fontSize: 9 },
  tableRow: { flexDirection: "row", padding: 8, borderBottomWidth: 1, borderColor: "#cbd5e1" },
  colItem: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  totals: { marginTop: 12, marginLeft: "auto", width: 240 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grand: { borderTopWidth: 2, marginTop: 4, paddingTop: 6, fontSize: 12, fontWeight: 700 },
  signature: { marginTop: 50, flexDirection: "row", justifyContent: "space-between" },
  signBlock: { textAlign: "center", width: 180 },
});

export function ClassicInvoicePDF({ invoice, company }: { invoice: InvoiceWithRelations; company: Company }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>INVOICE</Text>
        <Text style={styles.subtitle}>No. {invoice.invoiceNumber}</Text>
        <View style={styles.divider} />

        <View style={styles.twoCol}>
          <View>
            <Text style={styles.bold}>DARI:</Text>
            <Text style={[styles.bold, { fontSize: 12 }]}>{company.name}</Text>
            {company.address && <Text>{company.address}</Text>}
            <Text>{[company.city, company.province, company.postalCode].filter(Boolean).join(", ")}</Text>
            {company.npwp && <Text>NPWP: {company.npwp}</Text>}
            {company.phone && <Text>Telp: {company.phone}</Text>}
          </View>
          <View>
            <Text style={styles.bold}>UNTUK:</Text>
            <Text style={[styles.bold, { fontSize: 12 }]}>{invoice.client.name}</Text>
            {invoice.client.company && <Text>{invoice.client.company}</Text>}
            {invoice.client.address && <Text>{invoice.client.address}</Text>}
            <Text>{[invoice.client.city, invoice.client.province].filter(Boolean).join(", ")}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <Text>Tanggal Terbit: <Text style={styles.bold}>{pdfFormatDate(invoice.issueDate)}</Text></Text>
          <Text>Jatuh Tempo: <Text style={styles.bold}>{pdfFormatDate(invoice.dueDate)}</Text></Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colItem}>Deskripsi</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Harga</Text>
            <Text style={styles.colTotal}>Subtotal</Text>
          </View>
          {invoice.items.map((it) => (
            <View key={it.id} style={styles.tableRow}>
              <View style={styles.colItem}>
                <Text style={styles.bold}>{it.name}</Text>
                {it.description && <Text style={{ fontSize: 8 }}>{it.description}</Text>}
              </View>
              <Text style={styles.colQty}>{it.quantity}</Text>
              <Text style={styles.colPrice}>{pdfFormatCurrency(it.unitPrice, company.currency as any)}</Text>
              <Text style={styles.colTotal}>{pdfFormatCurrency(it.total, company.currency as any)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.row}><Text>Subtotal</Text><Text>{pdfFormatCurrency(invoice.subtotal, company.currency as any)}</Text></View>
          {invoice.discountAmount > 0 && <View style={styles.row}><Text>Diskon</Text><Text>- {pdfFormatCurrency(invoice.discountAmount, company.currency as any)}</Text></View>}
          <View style={styles.row}><Text>PPN ({invoice.taxRate}%)</Text><Text>{pdfFormatCurrency(invoice.taxAmount, company.currency as any)}</Text></View>
          <View style={[styles.row, styles.grand]}><Text>TOTAL</Text><Text>{pdfFormatCurrency(invoice.total, company.currency as any)}</Text></View>
        </View>

        {company.bankAccount && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.bold}>Pembayaran ditransfer ke:</Text>
            <Text>{company.bankName} {company.bankAccount} a.n. {company.bankHolder}</Text>
          </View>
        )}

        {invoice.notes && <View style={{ marginTop: 12 }}><Text style={styles.bold}>Catatan:</Text><Text>{invoice.notes}</Text></View>}
        {invoice.terms && <View style={{ marginTop: 8 }}><Text style={styles.bold}>Syarat:</Text><Text>{invoice.terms}</Text></View>}

        <View style={styles.signature}>
          <View style={styles.signBlock}>
            <Text>Hormat kami,</Text>
            <Text style={{ marginTop: 50 }}>_______________________</Text>
            <Text style={styles.bold}>{company.name}</Text>
          </View>
          <View style={styles.signBlock}>
            <Text>Diterima oleh,</Text>
            <Text style={{ marginTop: 50 }}>_______________________</Text>
            <Text style={styles.bold}>{invoice.client.name}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}