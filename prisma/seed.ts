import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seed() {
  const tableCount = await prisma.table.count();
  if (tableCount === 0) {
    await prisma.table.createMany({
      data: [
        { number: 1, capacity: 2 },
        { number: 2, capacity: 2 },
        { number: 3, capacity: 4 },
        { number: 4, capacity: 4 },
        { number: 5, capacity: 4 },
        { number: 6, capacity: 6 },
        { number: 7, capacity: 6 },
        { number: 8, capacity: 10 },
      ],
      skipDuplicates: true,
    });
    console.log("Seeded tables");
  }

  const menuCount = await prisma.menuItem.count();
  if (menuCount === 0) {
    await prisma.menuItem.createMany({
      data: [
        { name: "Nasi Goreng Spesial", category: "FOOD", price: 35000 },
        { name: "Ayam Bakar Madu", category: "FOOD", price: 42000 },
        { name: "Gurame Asam Manis", category: "FOOD", price: 68000 },
        { name: "Sayur Asem", category: "FOOD", price: 18000 },
        { name: "Es Teh Manis", category: "DRINK", price: 8000 },
        { name: "Jus Alpukat", category: "DRINK", price: 18000 },
        { name: "Kopi Lampung", category: "DRINK", price: 15000 },
      ],
    });
    console.log("Seeded menu items");
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
