import { describe, it } from "node:test";
import assert from "node:assert";
import { GamesService } from "../src/domain.ts";

describe("GamesService", () => {
  it("adds and lists games", () => {
    const games = new GamesService();
    const game = games.add({ title: "Aetherius Quest", genre: "RPG", installed: false });
    assert.equal(games.list().length, 1);
    assert.equal(game.genre, "RPG");
  });
});
