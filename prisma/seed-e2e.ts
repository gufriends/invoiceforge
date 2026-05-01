import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// E2E test user — local/CI only, no production access
const E2E_USER = {
  email: "e2e@invoiceforge.test",
  password: "E2eTestPassword123!",
  name: "E2E Test User",
};

async function main() {
  const hash = await bcrypt.hash(E2E_USER.password, 12);

  await prisma.user.upsert({
    where: { email: E2E_USER.email },
    update: { password: hash, name: E2E_USER.name },
    create: {
      email: E2E_USER.email,
      password: hash,
      name: E2E_USER.name,
      company: {
        create: {
          name: "E2E Test Business",
        },
      },
    },
  });

  console.log("✅ E2E user ready");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
