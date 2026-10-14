import { z } from "zod";

export const STATUSES = ["BOOKED", "SEATED", "DONE", "CANCELLED"] as const;

export const reservationInput = z.object({
  customerName: z.string().trim().min(2, "Nama minimal 2 karakter"),
  phone: z.string().regex(/^(\+62|0)\d{8,13}$/, "Nomor telepon tidak valid (contoh: 081234567890)"),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  tableId: z.number().int().positive("Pilih meja"),
  reservedAt: z.string().datetime("Waktu reservasi tidak valid"),
  durationMin: z.number().int().min(30, "Durasi minimal 30 menit").max(240, "Durasi maksimal 240 menit"),
  guests: z.number().int().min(1, "Minimal 1 tamu").max(20, "Maksimal 20 tamu"),
});

export const statusInput = z.object({ status: z.enum(STATUSES) });

export const orderInput = z.object({
  reservationId: z.number().int().positive(),
  discountPercent: z.number().min(0).max(100).default(0),
  items: z
    .array(z.object({ menuItemId: z.number().int().positive(), qty: z.number().int().min(1) }))
    .min(1, "Pilih minimal 1 menu"),
});
