import { handle } from "@/lib/api";
import { tableRepo } from "@/repositories";

export const dynamic = "force-dynamic";
export const GET = () => handle(() => tableRepo.list());
