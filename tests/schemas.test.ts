import { describe, expect, it } from "vitest";
import { orderInput, reservationInput } from "@/lib/schemas";

const valid = {
  customerName: "Siti", phone: "081234567890", tableId: 1,
  reservedAt: "2026-10-20T11:00:00.000Z", durationMin: 90, guests: 2,
};

describe("reservationInput", () => {
  it("menerima input valid", () => {
    expect(reservationInput.safeParse(valid).success).toBe(true);
  });
  it("menolak nomor telepon tidak valid", () => {
    expect(reservationInput.safeParse({ ...valid, phone: "abc" }).success).toBe(false);
  });
  it("menolak jumlah tamu 0", () => {
    expect(reservationInput.safeParse({ ...valid, guests: 0 }).success).toBe(false);
  });
});

describe("orderInput", () => {
  it("menolak pesanan tanpa item", () => {
    expect(orderInput.safeParse({ reservationId: 1, items: [] }).success).toBe(false);
  });
  it("memberi diskon default 0", () => {
    const r = orderInput.parse({ reservationId: 1, items: [{ menuItemId: 1, qty: 1 }] });
    expect(r.discountPercent).toBe(0);
  });
});
