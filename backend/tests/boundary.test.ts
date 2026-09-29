import { describe, expect, it } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
async function files(root: string): Promise<string[]> { return (await Promise.all((await readdir(root,{withFileTypes:true})).map(e => e.isDirectory()?files(path.join(root,e.name)):[path.join(root,e.name)]))).flat(); }
describe("frontend/backend boundary", () => {
  it("keeps persistence and backend secrets out of frontend source", async () => {
    const source = (await Promise.all((await files(path.resolve("../frontend/src"))).filter(f=>/\.[cm]?[jt]sx?$/.test(f)).map(f=>readFile(f,"utf8")))).join("\n");
    expect(source).not.toContain("@prisma/client");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("DATABASE_URL");
  });
});
