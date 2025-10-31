import fs from "node:fs/promises";
import path from "node:path";

export async function loadMdx(relPath: string) {
  const p = path.join(process.cwd(), "content", relPath);
  const raw = await fs.readFile(p, "utf8");
  return raw;
}
