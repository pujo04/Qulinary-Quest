import { prisma } from "@/lib/db";
import { Customer } from "@/models/Person";
import { MenuItem, createMenuItem, MenuCategory } from "@/models/MenuItem";
import { Order } from "@/models/Order";
import { Reservation, ReservationRow, ReservationStatus } from "@/models/Reservation";
import { Prisma, PrismaClient } from "@prisma/client";

export type DbClient = Prisma.TransactionClient | PrismaClient;

export interface TableRow { id: number; number: number; capacity: number; }

export const tableRepo = {
  list: async (): Promise<TableRow[]> =>
    prisma.table.findMany({
      orderBy: { number: "asc" },
      select: { id: true, number: true, capacity: true },
    }),
  find: async (id: number): Promise<TableRow | null> => {
    const byId = await prisma.table.findUnique({
      where: { id },
      select: { id: true, number: true, capacity: true },
    });
    if (byId) return byId;

    // Fallback: jika client mengirim nomor meja (misal: 1 s/d 8)
    return prisma.table.findUnique({
      where: { number: id },
      select: { id: true, number: true, capacity: true },
    });
  },
};

export const menuRepo = {
  list: async (): Promise<MenuItem[]> => {
    const rows = await prisma.menuItem.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true, category: true, price: true },
    });
    return rows.map((r) => createMenuItem(r as { id: number; name: string; category: MenuCategory; price: number }));
  },
};

export const customerRepo = {
  /** Insert jika baru, update jika nomor telepon sudah terdaftar. */
  async upsertByPhone(c: Customer, db: DbClient = prisma): Promise<number> {
    const row = await db.customer.upsert({
      where: { phone: c.phone },
      update: { name: c.name, email: c.email ?? null },
      create: { name: c.name, phone: c.phone, email: c.email ?? null },
      select: { id: true },
    });
    return row.id;
  },
};

export const reservationRepo = {
  async create(customerId: number, r: Reservation, db: DbClient = prisma): Promise<number> {
    const res = await db.reservation.create({
      data: {
        customerId,
        tableId: r.tableId,
        reservedAt: r.startsAt,
        durationMin: r.durationMin,
        guests: r.guests,
        status: r.status,
      },
      select: { id: true },
    });
    return res.id;
  },
  async list(fromIso?: string) {
    const reservations = await prisma.reservation.findMany({
      where: fromIso ? { reservedAt: { gte: new Date(fromIso) } } : undefined,
      orderBy: { reservedAt: "desc" },
      take: 100,
      include: {
        customer: { select: { name: true, phone: true } },
        table: { select: { number: true } },
      },
    });
    return reservations.map((r) => ({
      id: r.id,
      customerName: r.customer.name,
      phone: r.customer.phone,
      tableNumber: r.table.number,
      reservedAt: r.reservedAt.toISOString(),
      durationMin: r.durationMin,
      guests: r.guests,
      status: r.status as ReservationStatus,
    }));
  },
  async find(id: number, db: DbClient = prisma): Promise<ReservationRow | null> {
    const row = await db.reservation.findUnique({
      where: { id },
      select: { id: true, tableId: true, reservedAt: true, durationMin: true, guests: true, status: true },
    });
    if (!row) return null;
    return {
      id: row.id,
      table_id: row.tableId,
      reserved_at: row.reservedAt.toISOString(),
      duration_min: row.durationMin,
      guests: row.guests,
      status: row.status as ReservationStatus,
    };
  },
  async activeForTable(tableId: number, db: DbClient = prisma): Promise<ReservationRow[]> {
    const rows = await db.reservation.findMany({
      where: {
        tableId,
        status: { in: ["BOOKED", "SEATED"] },
      },
      select: { id: true, tableId: true, reservedAt: true, durationMin: true, guests: true, status: true },
    });
    return rows.map((r) => ({
      id: r.id,
      table_id: r.tableId,
      reserved_at: r.reservedAt.toISOString(),
      duration_min: r.durationMin,
      guests: r.guests,
      status: r.status as ReservationStatus,
    }));
  },
  async updateStatus(id: number, status: ReservationStatus, db: DbClient = prisma) {
    return db.reservation.update({
      where: { id },
      data: { status },
    });
  },
};

export const orderRepo = {
  async create(o: Order, db: DbClient = prisma): Promise<number> {
    const res = await db.order.create({
      data: {
        reservationId: o.reservationId,
        subtotal: o.subtotal,
        serviceCharge: o.serviceCharge,
        discount: o.discount,
        total: o.total,
        orderItems: {
          create: o.lines.map((l) => ({
            menuItemId: l.item.id,
            qty: l.qty,
            unitPrice: l.item.price,
          })),
        },
      },
      select: { id: true },
    });
    return res.id;
  },
  async list() {
    const orders = await prisma.order.findMany({
      orderBy: { id: "desc" },
      take: 20,
      include: {
        reservation: {
          include: {
            table: { select: { number: true } },
            customer: { select: { name: true } },
          },
        },
      },
    });
    return orders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt.toISOString(),
      total: o.total,
      tableNumber: o.reservation.table.number,
      customerName: o.reservation.customer.name,
    }));
  },
};

export const reportRepo = {
  async summary(fromIso: string, toIso: string) {
    const fromDate = new Date(fromIso);
    const toDate = new Date(toIso);

    const statusGroups = await prisma.reservation.groupBy({
      by: ["status"],
      where: {
        reservedAt: {
          gte: fromDate,
          lt: toDate,
        },
      },
      _count: {
        status: true,
      },
    });
    const byStatus = statusGroups.map((g) => ({
      status: g.status as ReservationStatus,
      n: g._count.status,
    }));

    const salesAggregate = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: fromDate,
          lt: toDate,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    });
    const orders = salesAggregate._count.id;
    const revenue = salesAggregate._sum.total ?? 0;

    const topItems = await prisma.orderItem.groupBy({
      by: ["menuItemId"],
      where: {
        order: {
          createdAt: {
            gte: fromDate,
            lt: toDate,
          },
        },
      },
      _sum: {
        qty: true,
      },
      orderBy: {
        _sum: {
          qty: "desc",
        },
      },
      take: 5,
    });

    const menuIds = topItems.map((t) => t.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuIds } },
      select: { id: true, name: true },
    });
    const menuMap = new Map(menuItems.map((m) => [m.id, m.name]));

    const topMenu = topItems.map((t) => ({
      name: menuMap.get(t.menuItemId) ?? "Unknown",
      qty: Number(t._sum.qty ?? 0),
    }));

    return { byStatus, orders, revenue, topMenu };
  },
};
