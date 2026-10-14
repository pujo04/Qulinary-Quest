import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";
import { logger } from "./logger";

/** Pembungkus API route: satu tempat untuk menerjemahkan error menjadi respons JSON. */
export async function handle(fn: () => unknown | Promise<unknown>, successStatus = 200) {
  try {
    return NextResponse.json(await fn(), { status: successStatus });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: e.issues.map((i) => i.message).join("; ") }, { status: 400 });
    }
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    logger.error("Unhandled error di API", e);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
