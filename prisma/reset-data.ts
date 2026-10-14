import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Emptying all tables and resetting clean database data...");
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.menuItem.deleteMany({});

  console.log("Seeding canonical tables (1-8)...");
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
  });

  console.log("Seeding canonical menu items (7 items)...");
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

  const tableCount = await prisma.table.count();
  const menuCount = await prisma.menuItem.count();
  const resCount = await prisma.reservation.count();
  const orderCount = await prisma.order.count();

  console.log(`Database is clean: Tables=${tableCount}, MenuItems=${menuCount}, Reservations=${resCount}, Orders=${orderCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
