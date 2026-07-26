import { copyFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";

const buildDirectory = join(process.cwd(), ".next");
const source = join(buildDirectory, "routes-manifest.json");
const deterministic = join(buildDirectory, "routes-manifest-deterministic.json");

try {
  await access(deterministic, constants.F_OK);
} catch {
  // Vercel's current Next.js build collector asks for the deterministic
  // manifest while Next 16.2 emits the equivalent routes-manifest.json.
  // Supplying the compatibility filename prevents a successful build from
  // being changed to ENOENT during the final collection step.
  await copyFile(source, deterministic);
}
