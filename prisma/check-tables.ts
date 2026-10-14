import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const tables = await prisma.table.findMany({ orderBy: { number: "asc" } });
  console.log("TABLES IN DB:", JSON.stringify(tables, null, 2));
}

check().finally(() => prisma.$disconnect());
