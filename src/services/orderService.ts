import { prisma } from "@/lib/db";
import { AppError, DomainError } from "@/lib/errors";
import { orderInput } from "@/lib/schemas";
import { NoDiscount, Order, PercentDiscount } from "@/models/Order";
import { menuRepo, orderRepo, reservationRepo } from "@/repositories";

export async function createOrder(raw: unknown) {
  const input = orderInput.parse(raw);
  return prisma.$transaction(async (tx) => {
    const reservation = await reservationRepo.find(input.reservationId, tx);
    if (!reservation) throw new AppError("Reservasi tidak ditemukan", 404);
    if (reservation.status !== "SEATED") throw new DomainError("Pesanan hanya bisa dibuat untuk tamu yang sudah duduk");

    const menuItems = await menuRepo.list();
    const menu = new Map(menuItems.map((m) => [m.id, m]));
    const order = new Order(
      input.reservationId,
      input.discountPercent > 0 ? new PercentDiscount(input.discountPercent) : new NoDiscount(),
    );
    for (const line of input.items) {
      const item = menu.get(line.menuItemId);
      if (!item) throw new AppError(`Menu #${line.menuItemId} tidak ditemukan`, 404);
      order.addItem(item, line.qty);
    }
    const id = await orderRepo.create(order, tx);
    return {
      id,
      subtotal: order.subtotal,
      serviceCharge: order.serviceCharge,
      discount: order.discount,
      total: order.total,
    };
  });
}
