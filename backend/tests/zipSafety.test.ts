// ZIP upload safety (release gate): traversal, absolute and drive-letter entries never produce a package. JSZip first normalizes "../"
// away; the strict top-level allowlist then refuses the stray file, and absolute / drive-letter names are refused outright.

import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { extractZipPackage } from "../src/modules/cms/animationPackage.service.js";

async function zipWith(entries: Record<string, string>): Promise<Buffer> {
  const zip = new JSZip();
  for (const [name, content] of Object.entries(entries)) zip.file(name, content, { createFolders: false });
  return Buffer.from(await zip.generateAsync({ type: "nodebuffer" }));
}
const base = { "animation.html": "<html><body>ok</body></html>", "manifest.json": JSON.stringify({ title: "t", bridgeVersion: 1, capabilities: [] }) };

describe("animation ZIP entry safety", () => {
  it("accepts a plain, well-formed package", async () => {
    const out = await extractZipPackage(await zipWith(base));
    expect(out.html).toContain("ok");
  });
  for (const evil of ["../evil.js", "a/../../evil.js", "/etc/passwd.js", "\evil.js", "C:/evil.js", "C:\evil.js"]) {
    it(`refuses an entry named ${JSON.stringify(evil)}`, async () => {
      await expect(extractZipPackage(await zipWith({ ...base, [evil]: "alert(1)" }))).rejects.toThrow(/Unsafe entry path|Unexpected file in ZIP/);
    });
  }
  it("refuses a file that is not a ZIP", async () => {
    await expect(extractZipPackage(Buffer.from("not a zip"))).rejects.toThrow(/not a valid ZIP/);
  });
});
