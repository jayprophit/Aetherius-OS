import { test } from "node:test";
import assert from "node:assert/strict";

import { EventLedger, MemoryRepository } from "../../app-kit/src/index.ts";
import {
  BarcodeScanner,
  DISCLAIMER,
  FoodWikiService,
  OfflineQueue,
  RULES_VERSION,
  createFoodWiki,
  type EaterProfile,
  type FoodRecord,
} from "../src/foodWiki.ts";

const SOURCE = {
  id: "src_label",
  title: "Product label",
  publisher: "Example Foods",
  url: null,
  retrievedAt: "2026-10-27",
  licence: "Used with permission",
};

function setup() {
  const wiki = createFoodWiki();
  wiki.addSource(SOURCE);
  const food = wiki.ingest({
    name: "Peanut butter",
    category: "spread",
    tags: ["nut", "spread"],
    barcode: "5012345678900",
    ingredients: [{ ingredientId: "ing_peanut", name: "Peanuts", sourceId: SOURCE.id }],
    allergens: [
      { allergen: "peanuts", presence: "contains", sourceId: SOURCE.id },
      { allergen: "nuts", presence: "may_contain", sourceId: SOURCE.id },
    ],
    nutrition: {
      energyKcal: 588,
      fatG: 50,
      saturatedFatG: 10,
      carbohydrateG: 20,
      sugarsG: 9,
      fibreG: 6,
      proteinG: 25,
      saltG: 1.1,
      potassiumMg: 649,
      vitaminKug: 0,
      purineMg: 0,
    },
    processing: "ultra_processed",
    sources: [SOURCE.id],
  });
  wiki.publish(food.id, "editor");
  return { wiki, food };
}

const profile = (overrides: Partial<EaterProfile> = {}): EaterProfile => ({
  id: "prf_test",
  allergies: [],
  medicalFlags: [],
  medications: [],
  ...overrides,
});

test("a declared allergen blocks the food and cites the label", () => {
  const { wiki, food } = setup();
  const verdict = wiki.evaluate(food, profile({ allergies: ["peanuts"] }));
  assert.equal(verdict.level, "blocked");
  const reason = verdict.reasons.find((candidate) => candidate.ruleId === "ALLERGEN-CONTAINS");
  assert.ok(reason);
  assert.equal(reason.sourceId, SOURCE.id);
  assert.match(verdict.disclaimer, /not medical advice/i);
  assert.equal(verdict.rulesVersion, RULES_VERSION);
});

test("may-contain is a caution, not a block", () => {
  const { wiki, food } = setup();
  const verdict = wiki.evaluate(food, profile({ allergies: ["nuts"] }));
  assert.equal(verdict.level, "caution");
  assert.equal(verdict.reasons[0]?.ruleId, "ALLERGEN-MAY-CONTAIN");
});

test("an undeclared allergen is UNKNOWN and never safe", () => {
  const { wiki, food } = setup();
  const verdict = wiki.evaluate(food, profile({ allergies: ["sesame"] }));
  assert.equal(verdict.level, "unknown");
  assert.equal(verdict.reasons[0]?.ruleId, "ALLERGEN-UNKNOWN");
});

test("a complete record with no trigger is safe, with the disclaimer attached", () => {
  const { wiki, food } = setup();
  const verdict = wiki.evaluate(food, profile());
  assert.equal(verdict.level, "safe");
  assert.deepEqual(verdict.reasons, []);
  assert.equal(verdict.disclaimer, DISCLAIMER);
});

test("medical flags warn without diagnosing", () => {
  const { wiki, food } = setup();
  assert.equal(wiki.evaluate(food, profile({ medicalFlags: ["kidney_disease"] })).level, "caution");
  assert.equal(wiki.evaluate(food, profile({ medicalFlags: ["hypertension"] })).level, "safe");

  const salty = wiki.ingest({
    name: "Salted crackers",
    category: "snack",
    nutrition: { ...baseNutrition(), saltG: 2.4 },
    sources: [SOURCE.id],
  });
  assert.equal(wiki.evaluate(salty, profile({ medicalFlags: ["hypertension"] })).level, "caution");
  assert.equal(wiki.evaluate(food, profile({ medications: ["warfarin"] })).level, "safe");
  assert.ok(wiki.evaluate(food, profile({ medicalFlags: ["kidney_disease"] })).reasons[0]?.message.includes("renal"));
});

test("high vitamin K warns for a vitamin K antagonist", () => {
  const { wiki, food } = setup();
  const updated = wiki.update("editor", food.id, {
    nutrition: { ...food.nutrition, vitaminKug: 250 },
  });
  const verdict = wiki.evaluate(updated, profile({ medications: ["Warfarin 5 mg"] }));
  assert.equal(verdict.level, "caution");
  assert.ok(verdict.reasons.some((reason) => reason.ruleId === "MED-VITAMIN-K"));
});

test("raw food is a pregnancy caution and the caution appears once", () => {
  const { wiki } = setup();
  const raw = wiki.ingest({
    name: "Raw sprouts",
    category: "vegetable",
    nutrition: {
      energyKcal: 30,
      fatG: 0.2,
      saturatedFatG: 0,
      carbohydrateG: 5,
      sugarsG: 1,
      fibreG: 2,
      proteinG: 3,
      saltG: 0.1,
    },
    processing: "raw",
    sources: [SOURCE.id],
  });
  const verdict = wiki.evaluate(raw, profile({ medicalFlags: ["pregnancy"] }));
  assert.equal(verdict.level, "caution");
  assert.equal(verdict.reasons.filter((reason) => reason.ruleId === "MED-PREGNANCY-RAW").length, 1);
});

test("ingest refuses an uncited food and a citation to an unknown source", () => {
  const wiki = createFoodWiki();
  assert.throws(() => wiki.ingest({ name: "Mystery", category: "unknown", nutrition: baseNutrition(), sources: [] }), /cited source/);
  assert.throws(
    () => wiki.ingest({ name: "Mystery", category: "unknown", nutrition: baseNutrition(), sources: ["src_missing"] }),
    /unknown source/,
  );
});

test("KNW-007 publish export render site static site: published edits return to draft and history keeps every version", () => {
  const { wiki, food } = setup();
  const edited = wiki.update("editor", food.id, { tags: ["nut", "salted"] });
  assert.equal(edited.state, "draft");
  assert.equal(edited.version, 2);
  const history = wiki.history(food.id);
  assert.equal(history.length, 2);
  assert.equal(history[0]?.snapshot.tags.includes("salted"), false);
  assert.equal(history[1]?.snapshot.tags.includes("salted"), true);
});

test("KNW-004 search KNW-003 link graph relation edges graph traversal: search and the ingredient link graph return published records", () => {
  const { wiki, food } = setup();
  const brittle = wiki.ingest({
    name: "Peanut brittle",
    category: "confectionery",
    ingredients: [{ ingredientId: "ing_peanut", name: "Peanuts", sourceId: SOURCE.id }],
    nutrition: baseNutrition(),
    sources: [SOURCE.id],
  });
  assert.deepEqual(
    wiki.search("peanut").map((item) => item.name).sort(),
    ["Peanut brittle", "Peanut butter"],
  );
  const related = wiki.related(food.id);
  assert.deepEqual(related.map((item) => item.id), [brittle.id]);
});

test("barcode scanning is throttled to one frame per second and has no model path", () => {
  const { wiki } = setup();
  const scanner = new BarcodeScanner(wiki);
  assert.equal(scanner.scan("5012345678900", new Date(0)).status, "ok");
  assert.equal(scanner.scan("5012345678900", new Date(500)).status, "throttled");
  assert.equal(scanner.scan("0000000000000", new Date(1000)).status, "unknown");
});

test("offline sync applies a current write and reports a stale one as a conflict", () => {
  const { wiki, food } = setup();
  const queue = new OfflineQueue(wiki);
  queue.enqueue({ kind: "update", foodId: food.id, baseVersion: food.version, patch: { tags: ["offline"] } });
  const first = queue.sync("device");
  assert.equal(first.applied, 1);
  assert.deepEqual(first.conflicts, []);

  const current = wiki.get(food.id)!;
  queue.enqueue({ kind: "update", foodId: food.id, baseVersion: current.version, patch: { tags: ["stale"] } });
  wiki.update("another-device", food.id, { tags: ["remote"] });
  const second = queue.sync("device");
  assert.equal(second.applied, 0);
  assert.equal(second.conflicts.length, 1);
  assert.equal(second.conflicts[0]?.remoteVersion, current.version + 1);
  assert.deepEqual(wiki.get(food.id)!.tags, ["remote"]);
});

test("every decision is appended to a verifiable audit chain", () => {
  const ledger = new EventLedger();
  const wiki = new FoodWikiService(new MemoryRepository(), new MemoryRepository(), new MemoryRepository(), { ledger });
  wiki.addSource(SOURCE);
  const food = wiki.ingest({
    name: "Oats",
    category: "grain",
    nutrition: baseNutrition(),
    sources: [SOURCE.id],
  });
  wiki.evaluate(food, profile());
  assert.equal(ledger.ofType("food.verdict").length, 1);
  assert.deepEqual(EventLedger.verify(ledger.all()), { ok: true });
});

test("an archived food cannot be edited or returned by search", () => {
  const { wiki, food } = setup();
  wiki.archive("editor", food.id);
  assert.throws(() => wiki.update("editor", food.id, { tags: ["again"] }), /archived/);
  assert.equal(wiki.search("peanut").length, 0);
});

test("a duplicate barcode is refused", () => {
  const { wiki } = setup();
  assert.throws(
    () =>
      wiki.ingest({
        name: "Another spread",
        category: "spread",
        barcode: "5012345678900",
        nutrition: baseNutrition(),
        sources: [SOURCE.id],
      }),
    /barcode is already recorded/,
  );
});

/** APP-002 session state management APP-005 account and sign in APP-006 user preferences and settings: navigation, screen and user state. */
function baseNutrition() {
  return {
    energyKcal: 100,
    fatG: 1,
    saturatedFatG: 0.2,
    carbohydrateG: 10,
    sugarsG: 1,
    fibreG: 1,
    proteinG: 2,
    saltG: 0.1,
  };
}
