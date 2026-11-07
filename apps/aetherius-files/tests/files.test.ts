import { describe, it } from "node:test";
import assert from "node:assert";
import { FileSystem } from "../src/domain.ts";

describe("FileSystem", () => {
  it("creates files and directories", () => {
    const fs = new FileSystem();
    const dir = fs.createDirectory("Documents", "/home/user");
    const file = fs.createFile("notes.txt", "/home/user/Documents", 1024);
    assert.equal(dir.isDirectory, true);
    assert.equal(file.isDirectory, false);
    assert.equal(fs.list("/home/user/Documents").length, 1);
  });
});
