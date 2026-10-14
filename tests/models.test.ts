import { describe, expect, it } from "vitest";
import { Customer } from "@/models/Person";
import { Drink, Food } from "@/models/MenuItem";
import { NoDiscount, Order, PercentDiscount } from "@/models/Order";
import { Reservation } from "@/models/Reservation";
import { DomainError } from "@/lib/errors";

const at = (hhmm: string) => new Date(`2026-10-20T${hhmm}:00Z`);
const res = (tableId: number, start: string, durationMin = 90) =>
  new Reservation({ tableId, startsAt: at(start), durationMin, guests: 2 });

describe("Customer (Person)", () => {
  it("menerima data valid dan merapikan spasi", () => {
    expect(new Customer("  Budi ", "0812345678").describe()).toBe("Budi (0812345678)");
  });
  it("menolak nama kosong", () => {
    expect(() => new Customer("   ", "0812345678")).toThrow(DomainError);
  });
});

describe("Order & MenuItem (polymorphism)", () => {
  const nasi = new Food(1, "Nasi Goreng", 30000); // service 5%
  const teh = new Drink(2, "Es Teh", 10000); // service 0%

  it("menghitung subtotal, service, diskon, dan total", () => {
    const o = new Order(1, new PercentDiscount(10));
    o.addItem(nasi, 2);
    o.addItem(teh, 1);
    expect(o.subtotal).toBe(70000);
    expect(o.serviceCharge).toBe(3000);
    expect(o.discount).toBe(7000);
    expect(o.total).toBe(66000);
  });
  it("menggabungkan item yang sama", () => {
    const o = new Order(1, new NoDiscount());
    o.addItem(teh, 1);
    o.addItem(teh, 2);
    expect(o.lines).toHaveLength(1);
    expect(o.lines[0].qty).toBe(3);
  });
  it.each([0, -1, 1.5])("menolak qty tidak valid: %s", (q) => {
    expect(() => new Order(1).addItem(teh, q)).toThrow(DomainError);
  });
  it("menolak diskon di luar 0-100", () => {
    expect(() => new PercentDiscount(101)).toThrow(DomainError);
  });
});

describe("Reservation", () => {
  it("mendeteksi bentrok pada meja yang sama", () => {
    expect(res(1, "18:00").overlaps(res(1, "19:00"))).toBe(true);
  });
  it("tidak bentrok jika meja berbeda", () => {
    expect(res(1, "18:00").overlaps(res(2, "18:30"))).toBe(false);
  });
  it("tidak bentrok jika mulai tepat saat reservasi lain selesai (edge case)", () => {
    expect(res(1, "18:00", 60).overlaps(res(1, "19:00"))).toBe(false);
  });
  it("mengizinkan transisi BOOKED -> SEATED -> DONE", () => {
    const r = res(1, "18:00");
    r.changeStatus("SEATED");
    r.changeStatus("DONE");
    expect(r.status).toBe("DONE");
  });
  it("menolak transisi tidak sah", () => {
    expect(() => res(1, "18:00").changeStatus("DONE")).toThrow(DomainError);
  });
});
