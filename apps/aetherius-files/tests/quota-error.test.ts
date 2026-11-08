import { describe, it } from "node:test";
import assert from "node:assert";
import { FileSystem } from "../src/domain.ts";

describe("FileSystem quota and error handling (AETH-017)", () => {
  it("rejects duplicates, traversal, and invalid paths", () => {
    const fs = new FileSystem();
    fs.createFile("a.txt", "/docs");
    assert.throws(() => fs.createFile("a.txt", "/docs"), /already exists/);
    assert.throws(() => fs.createFile("../escape", "/docs"), /invalid name/);
    assert.throws(() => fs.createFile("ok.txt", "relative/path"), /invalid path/);
    assert.throws(() => fs.createFile("ok.txt", "/a/../b"), /invalid path/);
    assert.throws(() => fs.createDirectory("../../etc", "/root"), /invalid/);
  });

  it("enforces byte quota", () => {
    const fs = new FileSystem({ maxTotalBytes: 10 });
    fs.createFile("a.bin", "/d", 6);
    assert.throws(() => fs.createFile("b.bin", "/d", 5), /quota exceeded/);
    assert.equal(fs.usageBytes(), 6);
    assert.equal(fs.entryCount(), 1);
  });

  it("enforces entry-count quota", () => {
    const fs = new FileSystem({ maxEntries: 2, maxTotalBytes: 1_000_000 });
    fs.createFile("a.txt", "/d");
    fs.createFile("b.txt", "/d");
    assert.throws(() => fs.createFile("c.txt", "/d"), /quota exceeded/);
  });

  it("rejects negative and oversized sizes", () => {
    const fs = new FileSystem({ maxTotalBytes: 100 });
    assert.throws(() => fs.createFile("neg.txt", "/d", -1), /invalid size/);
    assert.throws(() => fs.createFile("big.bin", "/d", 101), /invalid size|quota/);
  });

  it("lists entries per directory and exposes quota status", () => {
    const fs = new FileSystem();
    fs.createDirectory("Documents", "/home/user");
    fs.createFile("notes.txt", "/home/user/Documents", 1024);
    assert.equal(fs.list("/home/user/Documents").length, 1);
    const status = fs.quotaStatus();
    assert.equal(status.entryCount, 2);
    assert.equal(status.totalBytes, 1024);
  });
});
