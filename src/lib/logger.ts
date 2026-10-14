/** Logger sederhana untuk debugging: menyertakan waktu, level, dan konteks. */
type Level = "INFO" | "ERROR";

function write(level: Level, message: string, context?: unknown): void {
  const line = `[${new Date().toISOString()}] ${level} ${message}`;
  if (level === "ERROR") console.error(line, context ?? "");
  else console.log(line, context ?? "");
}

export const logger = {
  info: (m: string, c?: unknown) => write("INFO", m, c),
  error: (m: string, c?: unknown) => write("ERROR", m, c),
};
