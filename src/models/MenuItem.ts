import { DomainError } from "@/lib/errors";

export type MenuCategory = "FOOD" | "DRINK";

export abstract class MenuItem {
  constructor(readonly id: number, readonly name: string, private readonly basePrice: number) {
    if (basePrice < 0) throw new DomainError("Harga tidak boleh negatif");
  }

  abstract get category(): MenuCategory;
  /** Tarif service charge ditentukan oleh subclass (polymorphism). */
  protected abstract get serviceRate(): number;

  get price(): number { return this.basePrice; }

  serviceCharge(qty: number): number {
    return Math.round(this.price * qty * this.serviceRate);
  }

  toJSON() {
    return { id: this.id, name: this.name, category: this.category, price: this.price };
  }
}

export class Food extends MenuItem {
  get category(): MenuCategory { return "FOOD"; }
  protected get serviceRate(): number { return 0.05; }
}

export class Drink extends MenuItem {
  get category(): MenuCategory { return "DRINK"; }
  protected get serviceRate(): number { return 0; }
}

/** Factory: baris database -> objek yang tepat. */
export function createMenuItem(row: { id: number; name: string; category: MenuCategory; price: number }): MenuItem {
  return row.category === "FOOD" ? new Food(row.id, row.name, row.price) : new Drink(row.id, row.name, row.price);
}
