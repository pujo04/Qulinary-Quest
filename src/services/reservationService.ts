import { prisma } from "@/lib/db";
import { AppError, DomainError } from "@/lib/errors";
import { reservationInput, statusInput } from "@/lib/schemas";
import { Customer } from "@/models/Person";
import { Reservation } from "@/models/Reservation";
import { customerRepo, reservationRepo, tableRepo } from "@/repositories";

export async function createReservation(raw: unknown): Promise<{ id: number }> {
  const input = reservationInput.parse(raw);
  return prisma.$transaction(async (tx) => {
    const table = await tableRepo.find(input.tableId);
    if (!table) throw new AppError("Meja tidak ditemukan", 404);
    if (input.guests > table.capacity) {
      throw new DomainError(`Meja ${table.number} hanya muat ${table.capacity} orang`);
    }
    const startsAt = new Date(input.reservedAt);
    if (startsAt.getTime() < Date.now() - 5 * 60_000) throw new DomainError("Waktu reservasi sudah lewat");

    const candidate = new Reservation({ tableId: table.id, startsAt, durationMin: input.durationMin, guests: input.guests });
    const clash = (await reservationRepo.activeForTable(table.id, tx)).some((row) =>
      candidate.overlaps(Reservation.fromRow(row)),
    );
    if (clash) throw new DomainError(`Meja ${table.number} sudah dipesan pada jam tersebut`);

    const customerId = await customerRepo.upsertByPhone(
      new Customer(input.customerName, input.phone, input.email || undefined),
      tx,
    );
    const id = await reservationRepo.create(customerId, candidate, tx);
    return { id };
  });
}

export async function changeReservationStatus(id: number, raw: unknown): Promise<{ id: number; status: string }> {
  const { status } = statusInput.parse(raw);
  const row = await reservationRepo.find(id);
  if (!row) throw new AppError("Reservasi tidak ditemukan", 404);
  const reservation = Reservation.fromRow(row);
  reservation.changeStatus(status); // melempar DomainError jika transisi tidak sah
  await reservationRepo.updateStatus(id, reservation.status);
  return { id, status: reservation.status };
}
