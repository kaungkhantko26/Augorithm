import { copyFile, access, mkdir } from "node:fs/promises";
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

// With a monorepo Root Directory, Vercel 56 currently completes the build in
// `website/.next` but performs one final compatibility lookup at the checkout
// root. Mirror only the requested manifest there; the application output stays
// in the configured project directory.
if (process.env.VERCEL) {
  const collectorDirectory = join(process.cwd(), "..", ".next");
  await mkdir(collectorDirectory, { recursive: true });
  await copyFile(deterministic, join(collectorDirectory, "routes-manifest-deterministic.json"));
}
