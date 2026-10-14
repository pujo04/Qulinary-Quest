import { handle } from "@/lib/api";
import { changeReservationStatus } from "@/services/reservationService";

export const PATCH = (req: Request, { params }: { params: { id: string } }) =>
  handle(async () => changeReservationStatus(Number(params.id), await req.json()));
