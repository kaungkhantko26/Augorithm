import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`https://augorithm.example${pathname}`, {
      headers: {
        accept: "text/html",
        host: "augorithm.example",
        "x-forwarded-host": "augorithm.example",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the Augorithm product site and metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Augorithm — Think it\. Chart it\. Run it\./i);
  assert.match(html, /Don&#x27;t just write/);
  assert.match(html, /See it think/);
  assert.match(html, /Four ways to understand it/);
  assert.match(html, /Built for students who think visually/i);
  assert.match(html, /https:\/\/augorithm\.example\/og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("renders the shared web editor route", async () => {
  const response = await render("/editor");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Web Editor/);
  assert.match(html, /Project workspace/);
  assert.match(html, /Pseudocode editor/);
  assert.match(html, /Properties inspector/);
});

test("renders documentation for syntax, shortcuts, files, and iPad installation", async () => {
  const response = await render("/docs");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Classroom-friendly syntax/);
  assert.match(html, /Essential shortcuts/);
  assert.match(html, /Projects stay on your device/);
  assert.match(html, /Install as an iPad app/);
});

test("ships project-specific brand assets and removes starter preview", async () => {
  const [packageJson, page] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(packageJson, /"name": "augorithm-product-website"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(page, /AUGORITHM/);
  assert.match(page, /English \+ Burmese/);
  assert.match(page, /hero-product/);
  await access(new URL("../public/augorithm-icon.png", import.meta.url));
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../public/sw.js", import.meta.url));
  await access(new URL("../public/javascript-worker.js", import.meta.url));
  await access(new URL("../public/python-worker.js", import.meta.url));
  await access(new URL("../lib/augorithm-core.ts", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
