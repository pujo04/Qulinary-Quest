import { DomainError } from "@/lib/errors";

/** Kelas abstrak: data disimpan private (encapsulation), diakses lewat getter. */
export abstract class Person {
  private readonly _name: string;
  private readonly _phone: string;

  constructor(name: string, phone: string) {
    if (!name.trim()) throw new DomainError("Nama wajib diisi");
    if (!phone.trim()) throw new DomainError("Nomor telepon wajib diisi");
    this._name = name.trim();
    this._phone = phone.trim();
  }

  get name(): string { return this._name; }
  get phone(): string { return this._phone; }

  abstract describe(): string;
}

/** Inheritance: Customer mewarisi Person dan mengimplementasikan describe(). */
export class Customer extends Person {
  constructor(name: string, phone: string, readonly email?: string) {
    super(name, phone);
  }
  describe(): string { return `${this.name} (${this.phone})`; }
}
