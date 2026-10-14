/** Error aplikasi dengan HTTP status, agar API route bisa menjawab dengan benar. */
export class AppError extends Error {
  constructor(message: string, readonly status: number = 400) {
    super(message);
    this.name = "AppError";
  }
}

/** Pelanggaran aturan bisnis (mis. meja bentrok, transisi status tidak sah). */
export class DomainError extends AppError {
  constructor(message: string) {
    super(message, 422);
    this.name = "DomainError";
  }
}
