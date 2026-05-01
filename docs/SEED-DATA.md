# InvoiceForge — Seed Data Reference

> **PETUNJUK:** Data di file ini WAJIB diimplementasi PERSIS sama. Jangan ganti nama, email, dll.

---

## File: `prisma/seed.ts`

- [ ] Buat file `prisma/seed.ts`
- [ ] Salin konten di bawah PERSIS

```ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Bersihkan data lama
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  // ============ USERS ============
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const user1 = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "budi@invoiceforge.id",
      password: passwordHash,
      avatar: null,
      company: {
        create: {
          name: "PT Kreatif Digital Nusantara",
          address: "Jl. Sudirman No. 123, Lantai 5",
          city: "Jakarta Selatan",
          province: "DKI Jakarta",
          postalCode: "12190",
          country: "Indonesia",
          phone: "+62 21 5555 1234",
          email: "halo@kreatifdigital.id",
          website: "https://kreatifdigital.id",
          npwp: "01.234.567.8-901.000",
          bankName: "BCA",
          bankAccount: "1234567890",
          bankHolder: "Budi Santoso",
          invoicePrefix: "INV",
          invoiceTemplate: "modern",
          primaryColor: "#2563eb",
          currency: "IDR",
          taxRate: 11.0,
        },
      },
    },
    include: { company: true },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Siti Nurhaliza",
      email: "siti@invoiceforge.id",
      password: passwordHash,
      company: {
        create: {
          name: "Studio Desain Sekar",
          address: "Jl. Malioboro No. 45",
          city: "Yogyakarta",
          province: "DI Yogyakarta",
          postalCode: "55213",
          country: "Indonesia",
          phone: "+62 274 555 678",
          email: "studio@sekar.id",
          website: "https://sekardesign.id",
          npwp: "02.345.678.9-012.000",
          bankName: "Mandiri",
          bankAccount: "0987654321",
          bankHolder: "Siti Nurhaliza",
          invoicePrefix: "SDS",
          invoiceTemplate: "minimal",
          primaryColor: "#7c3aed",
          currency: "IDR",
          taxRate: 11.0,
        },
      },
    },
    include: { company: true },
  });

  const user3 = await prisma.user.create({
    data: {
      name: "Andi Wijaya",
      email: "andi@invoiceforge.id",
      password: passwordHash,
      company: {
        create: {
          name: "Wijaya Konsultan",
          address: "Jl. Asia Afrika No. 88",
          city: "Bandung",
          province: "Jawa Barat",
          postalCode: "40111",
          country: "Indonesia",
          phone: "+62 22 555 9012",
          email: "kontak@wijayakonsultan.com",
          website: "https://wijayakonsultan.com",
          npwp: "03.456.789.0-123.000",
          bankName: "BNI",
          bankAccount: "5678901234",
          bankHolder: "Andi Wijaya",
          invoicePrefix: "WK",
          invoiceTemplate: "classic",
          primaryColor: "#16a34a",
          currency: "IDR",
          taxRate: 11.0,
        },
      },
    },
    include: { company: true },
  });

  console.log("✅ 3 users created");

  // ============ CLIENTS (10 untuk user1) ============
  const clientsData = [
    {
      name: "Rizky Pratama",
      email: "rizky@tokopratama.id",
      phone: "+62 812 3456 7890",
      company: "PT Toko Pratama Sejahtera",
      address: "Jl. Gatot Subroto Kav. 27",
      city: "Jakarta Selatan",
      province: "DKI Jakarta",
      postalCode: "12930",
      npwp: "11.111.111.1-111.000",
      notes: "Klien lama, pembayaran selalu tepat waktu",
    },
    {
      name: "Dewi Lestari",
      email: "dewi@bumikreasi.com",
      phone: "+62 813 9876 5432",
      company: "CV Bumi Kreasi",
      address: "Jl. Diponegoro No. 15",
      city: "Surabaya",
      province: "Jawa Timur",
      postalCode: "60241",
      npwp: "22.222.222.2-222.000",
      notes: "Butuh invoice dengan PPN",
    },
    {
      name: "Hendra Kurniawan",
      email: "hendra@digitalwave.id",
      phone: "+62 815 1122 3344",
      company: "PT Digital Wave Indonesia",
      address: "Jl. HR Rasuna Said Blok X-2",
      city: "Jakarta Selatan",
      province: "DKI Jakarta",
      postalCode: "12950",
      npwp: "33.333.333.3-333.000",
      notes: null,
    },
    {
      name: "Maya Putri",
      email: "maya@cafenusantara.com",
      phone: "+62 819 5566 7788",
      company: "Cafe Nusantara Group",
      address: "Jl. Kemang Raya No. 50",
      city: "Jakarta Selatan",
      province: "DKI Jakarta",
      postalCode: "12730",
      npwp: null,
      notes: "Pembayaran via QRIS",
    },
    {
      name: "Bagus Setiawan",
      email: "bagus@tekno.co.id",
      phone: "+62 821 9988 7766",
      company: "PT Tekno Mandiri",
      address: "Jl. Pemuda No. 100",
      city: "Semarang",
      province: "Jawa Tengah",
      postalCode: "50132",
      npwp: "44.444.444.4-444.000",
      notes: null,
    },
    {
      name: "Linda Wijayanti",
      email: "linda@batikheritage.id",
      phone: "+62 822 3344 5566",
      company: "Batik Heritage Indonesia",
      address: "Jl. Slamet Riyadi No. 75",
      city: "Surakarta",
      province: "Jawa Tengah",
      postalCode: "57112",
      npwp: "55.555.555.5-555.000",
      notes: "UMKM binaan",
    },
    {
      name: "Rendra Aditama",
      email: "rendra@dagangonline.com",
      phone: "+62 823 7788 9900",
      company: "Dagang Online Sukses",
      address: "Jl. Imam Bonjol No. 25",
      city: "Medan",
      province: "Sumatera Utara",
      postalCode: "20112",
      npwp: "66.666.666.6-666.000",
      notes: null,
    },
    {
      name: "Putri Anggraini",
      email: "putri@florafashion.id",
      phone: "+62 877 1234 5678",
      company: "Flora Fashion Boutique",
      address: "Jl. Pantai Kuta No. 22",
      city: "Denpasar",
      province: "Bali",
      postalCode: "80361",
      npwp: null,
      notes: "Klien baru, hati-hati follow up",
    },
    {
      name: "Yusuf Hakim",
      email: "yusuf@logistikcepat.com",
      phone: "+62 856 9988 1122",
      company: "PT Logistik Cepat Express",
      address: "Jl. Gajah Mada No. 99",
      city: "Pontianak",
      province: "Kalimantan Barat",
      postalCode: "78117",
      npwp: "77.777.777.7-777.000",
      notes: null,
    },
    {
      name: "Sari Wulandari",
      email: "sari@edukasi.org",
      phone: "+62 858 4455 6677",
      company: "Yayasan Edukasi Anak Bangsa",
      address: "Jl. Pahlawan No. 8",
      city: "Makassar",
      province: "Sulawesi Selatan",
      postalCode: "90111",
      npwp: "88.888.888.8-888.000",
      notes: "Lembaga non-profit",
    },
  ];

  const clients: Awaited<ReturnType<typeof prisma.client.create>>[] = [];
  for (const data of clientsData) {
    const client = await prisma.client.create({
      data: { ...data, userId: user1.id, country: "Indonesia", isActive: true },
    });
    clients.push(client);
  }

  console.log("✅ 10 clients created");

  // ============ INVOICES (30 untuk user1) ============
  const today = new Date();
  const invoiceTemplates = [
    {
      items: [
        { name: "Jasa Desain Website", description: "Homepage + 5 halaman", quantity: 1, unitPrice: 10000000 },
        { name: "Setup SEO Dasar", description: "On-page SEO", quantity: 1, unitPrice: 2500000 },
      ],
      taxRate: 11,
    },
    {
      items: [
        { name: "Konsultasi Bisnis", description: "Sesi 4 jam", quantity: 4, unitPrice: 750000 },
      ],
      taxRate: 0,
    },
    {
      items: [
        { name: "Maintenance Bulanan", description: "Periode April 2026", quantity: 1, unitPrice: 1500000 },
      ],
      taxRate: 11,
    },
    {
      items: [
        { name: "Pembuatan Konten Sosmed", description: "20 post Instagram", quantity: 20, unitPrice: 150000 },
        { name: "Foto Produk", description: "Editing", quantity: 30, unitPrice: 50000 },
      ],
      taxRate: 11,
    },
    {
      items: [
        { name: "Logo Design Package", description: "Logo + brand guideline", quantity: 1, unitPrice: 3500000 },
      ],
      taxRate: 11,
    },
    {
      items: [
        { name: "Pelatihan Digital Marketing", description: "2 hari workshop", quantity: 1, unitPrice: 5000000 },
        { name: "Modul cetak", description: null, quantity: 10, unitPrice: 75000 },
      ],
      taxRate: 11,
    },
    {
      items: [
        { name: "Mobile App Development", description: "iOS + Android", quantity: 1, unitPrice: 25000000 },
      ],
      taxRate: 11,
    },
    {
      items: [
        { name: "Copywriting Landing Page", description: null, quantity: 5, unitPrice: 500000 },
      ],
      taxRate: 0,
    },
  ];

  const statuses = ["DRAFT", "SENT", "VIEWED", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"] as const;
  const templates = ["modern", "classic", "minimal"] as const;

  const invoices: Awaited<ReturnType<typeof prisma.invoice.create>>[] = [];

  for (let i = 0; i < 30; i++) {
    const template = invoiceTemplates[i % invoiceTemplates.length];
    const client = clients[i % clients.length];
    const sequence = String(i + 1).padStart(4, "0");
    const invoiceNumber = `INV-2026-${sequence}`;

    // Tanggal terbit: 90 hari ke belakang sampai 7 hari ke belakang
    const daysAgo = 90 - i * 3;
    const issueDate = new Date(today);
    issueDate.setDate(issueDate.getDate() - daysAgo);

    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Status distribution: 4 DRAFT, 6 SENT, 4 VIEWED, 4 PARTIAL, 8 PAID, 3 OVERDUE, 1 CANCELLED
    let status: (typeof statuses)[number];
    if (i < 4) status = "DRAFT";
    else if (i < 10) status = "SENT";
    else if (i < 14) status = "VIEWED";
    else if (i < 18) status = "PARTIAL";
    else if (i < 26) status = "PAID";
    else if (i < 29) status = "OVERDUE";
    else status = "CANCELLED";

    // Hitung total
    const subtotal = template.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = (subtotal * template.taxRate) / 100;
    const total = subtotal + taxAmount;

    const paidAmount =
      status === "PAID" ? total : status === "PARTIAL" ? Math.floor(total / 2) : 0;

    const invoice = await prisma.invoice.create({
      data: {
        userId: user1.id,
        clientId: client.id,
        invoiceNumber,
        status,
        issueDate,
        dueDate,
        subtotal,
        taxRate: template.taxRate,
        taxAmount,
        discountType: "PERCENTAGE",
        discountValue: 0,
        discountAmount: 0,
        total,
        paidAmount,
        notes: i % 5 === 0 ? "Terima kasih atas kerjasamanya." : null,
        terms: "Pembayaran dilakukan dalam 30 hari sejak tanggal invoice diterbitkan.",
        template: templates[i % templates.length],
        sentAt: status === "DRAFT" ? null : new Date(issueDate.getTime() + 86400000),
        viewedAt:
          status === "VIEWED" || status === "PARTIAL" || status === "PAID"
            ? new Date(issueDate.getTime() + 2 * 86400000)
            : null,
        items: {
          create: template.items.map((item, idx) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            order: idx,
          })),
        },
      },
    });

    invoices.push(invoice);
  }

  console.log("✅ 30 invoices created");

  // ============ PAYMENTS (20 total) ============
  const paymentMethods = [
    "BANK_TRANSFER",
    "CASH",
    "E_WALLET",
    "QRIS",
    "CHEQUE",
    "OTHER",
  ] as const;

  let paymentCount = 0;
  for (const invoice of invoices) {
    if (paymentCount >= 20) break;
    if (invoice.status !== "PAID" && invoice.status !== "PARTIAL") continue;

    const amount = invoice.paidAmount;
    const method = paymentMethods[paymentCount % paymentMethods.length];
    const paymentDate = new Date(invoice.issueDate);
    paymentDate.setDate(paymentDate.getDate() + 5);

    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount,
        method,
        date: paymentDate,
        reference:
          method === "BANK_TRANSFER"
            ? `BCA-${Math.floor(Math.random() * 1000000000)}`
            : method === "QRIS"
              ? `QR-${Math.floor(Math.random() * 1000000)}`
              : null,
        notes:
          paymentCount % 3 === 0 ? "Pembayaran sudah terverifikasi" : null,
      },
    });

    paymentCount++;
  }

  console.log(`✅ ${paymentCount} payments created`);

  // ============ Sample data untuk user2 (1 client + 2 invoices saja) ============
  const c1 = await prisma.client.create({
    data: {
      userId: user2.id,
      name: "Bambang Sutrisno",
      email: "bambang@toko.id",
      phone: "+62 812 1111 2222",
      company: "Toko Bambang",
      city: "Yogyakarta",
      province: "DI Yogyakarta",
      country: "Indonesia",
      isActive: true,
    },
  });

  await prisma.invoice.create({
    data: {
      userId: user2.id,
      clientId: c1.id,
      invoiceNumber: "SDS-2026-0001",
      status: "PAID",
      issueDate: new Date(today.getTime() - 30 * 86400000),
      dueDate: new Date(today.getTime()),
      subtotal: 5000000,
      taxRate: 11,
      taxAmount: 550000,
      discountType: "PERCENTAGE",
      discountValue: 0,
      discountAmount: 0,
      total: 5550000,
      paidAmount: 5550000,
      template: "minimal",
      items: {
        create: [
          {
            name: "Desain Brosur",
            description: "10 halaman A4",
            quantity: 1,
            unitPrice: 5000000,
            total: 5000000,
            order: 0,
          },
        ],
      },
    },
  });

  console.log("✅ Sample data for user2 & user3 created");
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Login Credentials (untuk testing)
- [ ] Catat credential ini

| Email | Password | Role |
|-------|----------|------|
| `budi@invoiceforge.id` | `Password123!` | Primary user (10 clients, 30 invoices, 20 payments) |
| `siti@invoiceforge.id` | `Password123!` | Secondary user (1 client, 1 invoice) |
| `andi@invoiceforge.id` | `Password123!` | Tertiary user (kosong) |

---

## Cara Run Seed
- [ ] Pastikan `package.json` punya script `"db:seed": "tsx prisma/seed.ts"`
- [ ] Pastikan `package.json` punya `"prisma": { "seed": "tsx prisma/seed.ts" }`
- [ ] Jalankan: `npx prisma migrate reset --force` (akan langsung jalanin seed)
- [ ] ATAU: `npx prisma db seed` (kalau migrate sudah jalan)

---

## Checklist Akhir
- [ ] File `prisma/seed.ts` selesai dengan konten lengkap
- [ ] `bcryptjs` & `tsx` terinstall di devDependencies
- [ ] Script `db:seed` ada di `package.json`
- [ ] Konfigurasi `prisma.seed` ada di `package.json`
- [ ] Seed berhasil dijalankan (cek di Prisma Studio: `npx prisma studio`)
