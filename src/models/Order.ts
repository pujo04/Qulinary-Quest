import { DomainError } from "@/lib/errors";
import { MenuItem } from "./MenuItem";

/** Strategy pattern: kebijakan diskon bisa diganti tanpa mengubah kelas Order. */
export interface DiscountPolicy { apply(subtotal: number): number; }

export class NoDiscount implements DiscountPolicy {
  apply(): number { return 0; }
}

export class PercentDiscount implements DiscountPolicy {
  constructor(private readonly percent: number) {
    if (percent < 0 || percent > 100) throw new DomainError("Diskon harus 0-100%");
  }
  apply(subtotal: number): number { return Math.round((subtotal * this.percent) / 100); }
}

export interface OrderLine { readonly item: MenuItem; readonly qty: number; }

export class Order {
  private _lines: OrderLine[] = [];

  constructor(readonly reservationId: number, private readonly policy: DiscountPolicy = new NoDiscount()) {}

  get lines(): readonly OrderLine[] { return this._lines; }

  addItem(item: MenuItem, qty: number): void {
    if (!Number.isInteger(qty) || qty <= 0) throw new DomainError("Jumlah harus bilangan bulat > 0");
    const existing = this._lines.find((l) => l.item.id === item.id);
    this._lines = existing
      ? this._lines.map((l) => (l === existing ? { item, qty: l.qty + qty } : l))
      : [...this._lines, { item, qty }];
  }

  get subtotal(): number { return this._lines.reduce((s, l) => s + l.item.price * l.qty, 0); }
  get serviceCharge(): number { return this._lines.reduce((s, l) => s + l.item.serviceCharge(l.qty), 0); }
  get discount(): number { return this.policy.apply(this.subtotal); }
  get total(): number { return this.subtotal + this.serviceCharge - this.discount; }
}
