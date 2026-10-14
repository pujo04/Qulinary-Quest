import { handle } from "@/lib/api";
import { orderRepo } from "@/repositories";
import { createOrder } from "@/services/orderService";

export const dynamic = "force-dynamic";
export const GET = () => handle(() => orderRepo.list());
export const POST = (req: Request) => handle(async () => createOrder(await req.json()), 201);
