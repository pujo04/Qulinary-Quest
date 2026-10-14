import { DomainError } from "@/lib/errors";

export type ReservationStatus = "BOOKED" | "SEATED" | "DONE" | "CANCELLED";

const TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  BOOKED: ["SEATED", "CANCELLED"],
  SEATED: ["DONE"],
  DONE: [],
  CANCELLED: [],
};

export const allowedTransitions = (s: ReservationStatus): ReservationStatus[] => TRANSITIONS[s];

export interface ReservationProps {
  id?: number;
  tableId: number;
  startsAt: Date;
  durationMin: number;
  guests: number;
  status?: ReservationStatus;
}

export interface ReservationRow {
  id: number; table_id: number; reserved_at: string;
  duration_min: number; guests: number; status: ReservationStatus;
}

export class Reservation {
  private _status: ReservationStatus;

  constructor(private readonly props: ReservationProps) {
    if (Number.isNaN(props.startsAt.getTime())) throw new DomainError("Waktu reservasi tidak valid");
    if (props.durationMin <= 0) throw new DomainError("Durasi harus > 0");
    if (props.guests <= 0) throw new DomainError("Jumlah tamu harus > 0");
    this._status = props.status ?? "BOOKED";
  }

  get id(): number | undefined { return this.props.id; }
  get tableId(): number { return this.props.tableId; }
  get startsAt(): Date { return this.props.startsAt; }
  get durationMin(): number { return this.props.durationMin; }
  get guests(): number { return this.props.guests; }
  get status(): ReservationStatus { return this._status; }
  get endsAt(): Date { return new Date(this.startsAt.getTime() + this.durationMin * 60_000); }

  /** Dua reservasi bentrok jika meja sama dan rentang waktunya beririsan. */
  overlaps(other: Reservation): boolean {
    return this.tableId === other.tableId && this.startsAt < other.endsAt && other.startsAt < this.endsAt;
  }

  changeStatus(next: ReservationStatus): void {
    if (!TRANSITIONS[this._status].includes(next)) {
      throw new DomainError(`Status ${this._status} tidak bisa diubah ke ${next}`);
    }
    this._status = next;
  }

  static fromRow(r: ReservationRow): Reservation {
    return new Reservation({
      id: r.id, tableId: r.table_id, startsAt: new Date(r.reserved_at),
      durationMin: r.duration_min, guests: r.guests, status: r.status,
    });
  }
}
