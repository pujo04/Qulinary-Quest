import { handle } from "@/lib/api";
import { menuRepo } from "@/repositories";

export const dynamic = "force-dynamic";
export const GET = () => handle(() => menuRepo.list());
