import { test } from "node:test";
import assert from "node:assert/strict";

import { EventLedger } from "../../app-kit/src/index.ts";
import type { Account } from "../../app-kit/src/index.ts";
import { createFoodWiki } from "../src/foodWiki.ts";
import type { NutritionPer100g } from "../src/foodWiki.ts";
import {
  BUILT_IN_FREQUENCIES,
  FoodWikiApp,
  FrequencyLibrary,
  LocationAtlas,
  PHOTO_NOTE,
  RIFE_DISCLAIMER,
  RecipeBook,
  createAthenaFoodTools,
  renderToneWav,
} from "../src/atlas.ts";

const CLOCK = () => new Date("2026-10-29T00:00:00.000Z");

function nutrition(): NutritionPer100g {
  return {
    energyKcal: 40,
    fatG: 0.5,
    saturatedFatG: 0.1,
    carbohydrateG: 5,
    sugarsG: 1,
    fibreG: 2,
    proteinG: 2,
    saltG: 0.01,
  };
}

function setup() {
  const wiki = createFoodWiki();
  const source = wiki.addSource({
    title: "Test label",
    publisher: "Aetherius test",
    url: null,
    retrievedAt: "2026-10-29",
    licence: "CC0-1.0",
  });
  const ledger = new EventLedger([], CLOCK);
  const atlas = new LocationAtlas(wiki, { ledger, clock: CLOCK });
  const recipes = new RecipeBook(wiki, { ledger, clock: CLOCK });
  const basil = wiki.ingest({
    name: "Basil",
    aliases: ["sweet basil"],
    category: "herb",
    kind: "herb",
    nutrition: nutrition(),
    sources: [source.id],
  });
  const tomato = wiki.ingest({
    name: "Tomato",
    category: "fruit",
    kind: "fruit",
    nutrition: nutrition(),
    sources: [source.id],
  });
  return { wiki, source, ledger, atlas, recipes, basil, tomato };
}

test("foods carry a kind and the catalogue can be filtered by it", () => {
  const { wiki, source, atlas } = setup();
  assert.equal(wiki.list().length, 2);
  assert.deepEqual(
    wiki.list().map((food) => food.kind),
    ["herb", "fruit"],
  );
  assert.equal(atlas.byKind("herb").length, 1);
  assert.equal(atlas.byKind("fruit")[0]?.name, "Tomato");
  assert.throws(() => atlas.byKind("mineral" as never), /unknown food kind/);

  const mushroom = wiki.ingest({
    name: "Oyster mushroom",
    category: "fungus",
    kind: "fungus",
    nutrition: nutrition(),
    sources: [source.id],
  });
  assert.equal(mushroom.kind, "fungus");
  assert.throws(
    () =>
      wiki.ingest({
        name: "Mystery",
        category: "unknown",
        kind: "mineral" as never,
        nutrition: nutrition(),
        sources: [source.id],
      }),
    /unknown food kind/,
  );
});

test("locations record wild, shop and market sources with seasons", () => {
  const { atlas, source, ledger, basil } = setup();
  const wild = atlas.add({
    foodId: basil.id,
    kind: "wild",
    name: "Hillside terrace",
    region: "Liguria",
    coordinates: { lat: 44.1, lon: 9.7 },
    seasonMonths: [5, 6, 7, 8],
    notes: "Forage only with permission.",
    sourceId: source.id,
  });
  assert.equal(wild.kind, "wild");
  assert.deepEqual(wild.seasonMonths, [5, 6, 7, 8]);

  atlas.add({
    foodId: basil.id,
    kind: "market",
    name: "Saturday market",
    region: "Liguria",
    sourceId: source.id,
  });
  atlas.add({
    foodId: basil.id,
    kind: "shop",
    name: "Greengrocer",
    region: "Provence",
    sourceId: source.id,
  });

  assert.equal(atlas.locationsFor(basil.id).length, 3);
  assert.equal(atlas.locationsFor(basil.id, 1).length, 2, "the year-round market and shop are in season in January");
  assert.equal(atlas.locationsFor(basil.id, 6).length, 3);
  assert.throws(() => atlas.locationsFor(basil.id, 13), /month is out of range/);
  assert.deepEqual(atlas.foodsInRegion("ligu").map((food) => food.name), ["Basil"]);
  assert.deepEqual(atlas.foodsInRegion("provence").map((food) => food.name), ["Basil"]);
  assert.equal(ledger.ofType("food.location.added").length, 3);

  assert.throws(
    () =>
      atlas.add({
        foodId: basil.id,
        kind: "wild",
        name: "Hillside terrace",
        region: "Liguria",
        sourceId: source.id,
      }),
    /already recorded/,
  );
  assert.throws(
    () => atlas.add({ foodId: "missing", kind: "shop", name: "X", region: "Y", sourceId: source.id }),
    /no food/,
  );
  assert.throws(
    () => atlas.add({ foodId: basil.id, kind: "shop", name: "X", region: "Y", coordinates: { lat: 91, lon: 0 }, sourceId: source.id }),
    /latitude is out of range/,
  );
  assert.throws(
    () => atlas.add({ foodId: basil.id, kind: "shop", name: "X", region: "Y", seasonMonths: [0], sourceId: source.id }),
    /month is out of range/,
  );
  assert.throws(
    () => atlas.add({ foodId: basil.id, kind: "shop", name: "X", region: "Y", sourceId: "  " }),
    /cited source/,
  );
});

test("recipes are validated and ranked by available ingredients", () => {
  const { recipes, source, basil, tomato, ledger } = setup();
  const pesto = recipes.add({
    title: "Basil pesto",
    servings: 4,
    ingredients: [
      { foodId: basil.id, name: "Basil", quantity: 50, unit: "g" },
      { foodId: tomato.id, name: "Tomato", quantity: 2, unit: "whole" },
      { foodId: null, name: "Olive oil", quantity: 100, unit: "ml", optional: true },
    ],
    steps: ["Blend the basil and tomato with the oil."],
    tags: ["Italian", "quick"],
    timeMinutes: 10,
    sourceId: source.id,
  });
  assert.equal(pesto.servings, 4);
  assert.deepEqual(pesto.tags, ["italian", "quick"]);

  const salad = recipes.add({
    title: "Tomato salad",
    servings: 2,
    ingredients: [
      { foodId: tomato.id, name: "Tomato", quantity: 3, unit: "whole" },
      { foodId: null, name: "Salt", quantity: 1, unit: "pinch" },
    ],
    steps: ["Slice and season."],
    timeMinutes: 5,
    sourceId: source.id,
  });

  const basilOnly = recipes.recipesFor([basil.id]);
  assert.equal(basilOnly.length, 1);
  assert.deepEqual(basilOnly[0]!.matched, ["Basil"]);
  assert.deepEqual(basilOnly[0]!.missing, ["Tomato"]);
  assert.equal(basilOnly[0]!.coverage, 0.5);

  const both = recipes.recipesFor([basil.id, tomato.id]);
  assert.deepEqual(both.map((entry) => entry.recipe.title), ["Basil pesto", "Tomato salad"]);
  assert.equal(both[0]!.coverage, 1);
  assert.equal(both[1]!.coverage, 1);

  assert.equal(recipes.get(salad.id)?.title, "Tomato salad");
  assert.equal(recipes.list().length, 2);
  assert.equal(ledger.ofType("food.recipe.added").length, 2);

  assert.throws(
    () =>
      recipes.add({
        title: "Bad",
        servings: 0,
        ingredients: [
          { foodId: basil.id, name: "Basil", quantity: 1, unit: "g" },
          { foodId: tomato.id, name: "Tomato", quantity: 1, unit: "g" },
        ],
        steps: ["x"],
        timeMinutes: 5,
        sourceId: source.id,
      }),
    /servings is out of range/,
  );
  assert.throws(
    () =>
      recipes.add({
        title: "Bad",
        servings: 2,
        ingredients: [{ foodId: basil.id, name: "Basil", quantity: 1, unit: "g" }],
        steps: ["x"],
        timeMinutes: 5,
        sourceId: source.id,
      }),
    /at least two ingredients/,
  );
  assert.throws(
    () =>
      recipes.add({
        title: "Bad",
        servings: 2,
        ingredients: [
          { foodId: "missing", name: "Mystery", quantity: 1, unit: "g" },
          { foodId: basil.id, name: "Basil", quantity: 1, unit: "g" },
        ],
        steps: ["x"],
        timeMinutes: 5,
        sourceId: source.id,
      }),
    /unknown food/,
  );
  assert.throws(
    () =>
      recipes.add({
        title: "Bad",
        servings: 2,
        ingredients: [
          { foodId: basil.id, name: "Basil", quantity: 0, unit: "g" },
          { foodId: tomato.id, name: "Tomato", quantity: 1, unit: "g" },
        ],
        steps: ["x"],
        timeMinutes: 5,
        sourceId: source.id,
      }),
    /quantity is out of range/,
  );
});

test("a photo detection list produces recipe suggestions without claiming vision", () => {
  const { recipes, source, basil, tomato } = setup();
  recipes.add({
    title: "Basil pesto",
    servings: 4,
    ingredients: [
      { foodId: basil.id, name: "Basil", quantity: 50, unit: "g" },
      { foodId: tomato.id, name: "Tomato", quantity: 2, unit: "whole" },
    ],
    steps: ["Blend."],
    timeMinutes: 10,
    sourceId: source.id,
  });

  const result = recipes.suggestFromPhoto([
    { label: "basil", confidence: 0.95 },
    { label: "sweet basil", confidence: 0.8 },
    { label: "unicorn", confidence: 0.9 },
    { label: "tomato", confidence: 0.2 },
  ]);
  assert.equal(result.note, PHOTO_NOTE);
  assert.equal(result.detections.length, 3, "the low-confidence tomato is ignored");
  assert.deepEqual(result.unmatched, ["unicorn"]);
  assert.equal(result.detections[0]!.foodId, basil.id);
  assert.equal(result.detections[1]!.foodId, basil.id, "an alias resolves to the same food");
  assert.equal(result.detections[2]!.foodId, null);
  assert.equal(result.suggestions.length, 1);
  assert.deepEqual(result.suggestions[0]!.matched, ["Basil"]);
  assert.deepEqual(result.suggestions[0]!.missing, ["Tomato"]);

  const strict = recipes.suggestFromPhoto([{ label: "basil", confidence: 0.4 }], { minConfidence: 0.9 });
  assert.equal(strict.detections.length, 0);
  assert.equal(strict.suggestions.length, 0);
  assert.throws(() => recipes.suggestFromPhoto([{ label: "basil", confidence: 2 }]), /confidence is out of range/);
  assert.throws(() => recipes.suggestFromPhoto([{ label: " ", confidence: 0.9 }]), /needs a label/);
  assert.throws(() => recipes.suggestFromPhoto([], { minConfidence: -1 }), /minConfidence is out of range/);
});

test("Rife-style frequencies are recorded honestly and render real WAV audio", () => {
  const library = new FrequencyLibrary({ clock: CLOCK });
  assert.equal(library.list().length, BUILT_IN_FREQUENCIES.length);
  assert.deepEqual(
    library.list().map((protocol) => protocol.frequencyHz),
    [727, 787, 880, 5000],
  );
  for (const protocol of library.list()) {
    assert.match(protocol.evidenceNote, /No robust clinical evidence/);
  }

  const custom = library.add({
    name: "Test 432 Hz",
    frequencyHz: 432,
    durationSeconds: 60,
    description: "A test protocol.",
    evidenceNote: RIFE_DISCLAIMER,
    sourceId: "test-source",
  });
  assert.equal(library.get(custom.id)?.frequencyHz, 432);
  assert.equal(library.list()[0]?.frequencyHz, 432);
  assert.throws(
    () =>
      library.add({
        name: "Too low",
        frequencyHz: 10,
        durationSeconds: 60,
        description: "x",
        evidenceNote: "x",
        sourceId: "x",
      }),
    /audible range/,
  );
  assert.throws(
    () =>
      library.add({
        name: "Too long",
        frequencyHz: 440,
        durationSeconds: 601,
        description: "x",
        evidenceNote: "x",
        sourceId: "x",
      }),
    /duration is out of range/,
  );

  const protocol = library.get("freq-727")!;
  const wav = renderToneWav(protocol, { sampleRate: 8000, durationSeconds: 0.1, amplitude: 0.5 });
  assert.equal(wav.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(wav.subarray(8, 12).toString("ascii"), "WAVE");
  assert.equal(wav.subarray(36, 40).toString("ascii"), "data");
  assert.equal(wav.readUInt16LE(20), 1, "PCM format");
  assert.equal(wav.readUInt16LE(22), 1, "mono");
  assert.equal(wav.readUInt32LE(24), 8000);
  assert.equal(wav.readUInt16LE(34), 16);
  assert.equal(wav.length, 44 + 800 * 2);
  assert.equal(wav.readUInt32LE(40), 800 * 2);
  assert.equal(wav.readInt16LE(44), 0, "the first sample is silent because of the fade");
  let peak = 0;
  for (let offset = 44; offset < wav.length; offset += 2) {
    peak = Math.max(peak, Math.abs(wav.readInt16LE(offset)));
  }
  assert.ok(peak > 0);
  assert.ok(peak <= Math.round(0.5 * 32767));
  assert.throws(() => renderToneWav(protocol, { sampleRate: 4000 }), /sampleRate is out of range/);
  assert.throws(() => renderToneWav(protocol, { amplitude: 0 }), /amplitude is out of range/);
  assert.throws(() => renderToneWav(protocol, { durationSeconds: 601 }), /duration is out of range/);
});

test("the app keeps navigation, account and preference state", () => {
  const { wiki, recipes, source, ledger, basil } = setup();
  recipes.add({
    title: "Basil pesto",
    servings: 4,
    ingredients: [
      { foodId: basil.id, name: "Basil", quantity: 50, unit: "g" },
      { foodId: null, name: "Oil", quantity: 100, unit: "ml" },
    ],
    steps: ["Blend."],
    timeMinutes: 10,
    sourceId: source.id,
  });
  const recipeId = recipes.list()[0]!.id;
  const app = new FoodWikiApp(wiki, { recipes, ledger, clock: CLOCK });

  assert.deepEqual(app.state().route, { screen: "home" });
  assert.equal(app.state().account, null);

  app.navigate({ screen: "search", query: "basil" });
  app.navigate({ screen: "food", foodId: basil.id });
  app.navigate({ screen: "recipe", recipeId });
  assert.equal(app.state().history.length, 3);
  assert.deepEqual(app.back(), { screen: "food", foodId: basil.id });
  assert.deepEqual(app.back(), { screen: "search", query: "basil" });
  assert.deepEqual(app.back(), { screen: "home" });
  assert.deepEqual(app.back(), { screen: "home" }, "back at the root is a no-op");

  assert.throws(() => app.navigate({ screen: "food" }), /needs a foodId/);
  assert.throws(() => app.navigate({ screen: "food", foodId: "missing" }), /no food/);
  assert.throws(() => app.navigate({ screen: "recipe", recipeId: "missing" }), /no recipe/);
  assert.throws(() => app.navigate({ screen: "camera" as never }), /unknown screen/);

  const account = app.signIn({ displayName: "Ada", email: "ada@example.test" });
  assert.equal(account.displayName, "Ada");
  assert.equal(app.state().account?.email, "ada@example.test");
  assert.throws(() => app.signIn({ displayName: " " }), /display name/);
  assert.throws(() => app.signIn({ displayName: "Ada", email: "not-an-email" }), /email is not valid/);

  const preferences = app.updatePreferences({ theme: "dark", units: "imperial", reduceMotion: true });
  assert.equal(preferences.theme, "dark");
  assert.equal(app.state().preferences.units, "imperial");
  assert.throws(() => app.updatePreferences({ theme: "sepia" as never }), /unknown theme/);
  assert.throws(() => app.updatePreferences({ units: "cubits" as never }), /unknown units/);
  assert.throws(() => app.updatePreferences({ locale: "not a locale" }), /language tag/);
  assert.throws(() => app.updatePreferences({ reduceMotion: "yes" as never }), /must be a boolean/);

  app.signOut();
  assert.equal(app.state().account, null);
  assert.equal(app.state().preferences.theme, "dark", "preferences survive sign-out");
  assert.equal(ledger.ofType("food.navigation").length, 3);
  assert.equal(ledger.ofType("food.account.signed_in").length, 1);
  assert.equal(ledger.ofType("food.account.signed_out").length, 1);
  assert.equal(ledger.ofType("food.preferences.changed").length, 1);
});

test("Athena receives read-only Food Wiki tools", () => {
  const { wiki, recipes, atlas, source, basil, tomato } = setup();
  recipes.add({
    title: "Basil pesto",
    servings: 4,
    ingredients: [
      { foodId: basil.id, name: "Basil", quantity: 50, unit: "g" },
      { foodId: tomato.id, name: "Tomato", quantity: 2, unit: "whole" },
    ],
    steps: ["Blend."],
    timeMinutes: 10,
    sourceId: source.id,
  });
  atlas.add({ foodId: basil.id, kind: "wild", name: "Hillside", region: "Liguria", seasonMonths: [6], sourceId: source.id });

  const tools = createAthenaFoodTools(wiki, recipes, atlas);
  assert.deepEqual(
    tools.map((tool) => tool.name),
    ["food.search", "food.verdict", "food.locations", "food.recipes"],
  );
  for (const tool of tools) {
    assert.ok(tool.description.length > 0);
    assert.deepEqual(tool.allowedRoles, ["member", "admin"]);
  }

  const account: Account = {
    id: "acc_test",
    handle: "ada",
    displayName: "Ada",
    email: "ada@example.test",
    roles: ["member"],
    status: "active",
    createdAt: "2026-10-29T00:00:00.000Z",
  };
  const context = { account, at: "2026-10-29T00:00:00.000Z" };
  const search = tools.find((tool) => tool.name === "food.search")!;
  const hits = search.handler({ query: "basil" }, context) as { id: string }[];
  assert.equal(hits[0]?.id, basil.id);

  const verdict = tools.find((tool) => tool.name === "food.verdict")!;
  const result = verdict.handler({ foodId: basil.id, allergies: ["peanuts"] }, context) as { level: string };
  assert.equal(result.level, "unknown", "missing allergen data is never safe");
  assert.throws(() => verdict.handler({ foodId: "missing" }, context), /no food/);

  const locations = tools.find((tool) => tool.name === "food.locations")!;
  assert.equal((locations.handler({ foodId: basil.id, month: 6 }, context) as unknown[]).length, 1);
  assert.equal((locations.handler({ foodId: basil.id, month: 1 }, context) as unknown[]).length, 0);

  const recipeTool = tools.find((tool) => tool.name === "food.recipes")!;
  const suggestions = recipeTool.handler({ foodIds: [basil.id] }, context) as { matched: string[] }[];
  assert.deepEqual(suggestions[0]?.matched, ["Basil"]);
});
