import { handle } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { reportRepo } from "@/repositories";

export const dynamic = "force-dynamic";

/** GET /api/report?from=<ISO>&to=<ISO> */
export const GET = (req: Request) =>
  handle(() => {
    const p = new URL(req.url).searchParams;
    const from = p.get("from");
    const to = p.get("to");
    if (!from || !to) throw new AppError("Parameter from dan to wajib diisi");
    return reportRepo.summary(from, to);
  });
