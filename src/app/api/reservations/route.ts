import { handle } from "@/lib/api";
import { reservationRepo } from "@/repositories";
import { createReservation } from "@/services/reservationService";

export const dynamic = "force-dynamic";

export const GET = (req: Request) =>
  handle(() => reservationRepo.list(new URL(req.url).searchParams.get("from") ?? undefined));

export const POST = (req: Request) => handle(async () => createReservation(await req.json()), 201);
