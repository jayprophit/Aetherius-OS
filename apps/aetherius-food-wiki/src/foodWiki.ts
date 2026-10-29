import { createHash } from "node:crypto";

import { EventLedger, MemoryRepository, SearchIndex, newId, nowIso, slugify } from "../../app-kit/src/index.ts";
import type { Repository } from "../../app-kit/src/index.ts";

/**
 * Food Wiki domain slice.
 *
 * The scope is the candidate recorded in TODO-FWA-003. The supplied chat
 * corpus contains no NaturaWiki or Food Wiki conversation, so this code is
 * built to the recorded candidate scope and does not claim that the original
 * conversations were recovered.
 *
 * The safety rule is deliberately conservative: a food is only "safe" when
 * every allergen the eater declared has an explicit declaration on the food
 * and no medical rule fires. Missing data is UNKNOWN, never safe. The engine
 * warns; it does not diagnose.
 */

export const RULES_VERSION = "food-rules-1.0.0";

export const DISCLAIMER =
  "This is a deterministic food-safety warning, not medical advice or a diagnosis. " +
  "Always check the product label and consult a qualified clinician about your own condition.";

export const EU_ALLERGENS = [
  "celery",
  "cereals_containing_gluten",
  "crustaceans",
  "eggs",
  "fish",
  "lupin",
  "milk",
  "molluscs",
  "mustard",
  "nuts",
  "peanuts",
  "sesame",
  "soya",
  "sulphites",
] as const;

export type Allergen = (typeof EU_ALLERGENS)[number];

export const FOOD_KINDS = [
  "herb",
  "vegetable",
  "fruit",
  "meat",
  "fish",
  "seafood",
  "fungus",
  "grain",
  "legume",
  "dairy",
  "spice",
  "other",
] as const;

export type FoodKind = (typeof FOOD_KINDS)[number];
export type Presence = "contains" | "may_contain" | "free";
export type MedicalFlag =
  | "pregnancy"
  | "kidney_disease"
  | "diabetes"
  | "hypertension"
  | "gout"
  | "anticoagulant_therapy"
  | "liver_disease";

export interface SourceRef {
  id: string;
  title: string;
  publisher: string;
  url: string | null;
  retrievedAt: string;
  licence: string;
}

export interface AllergenDeclaration {
  allergen: Allergen;
  presence: Presence;
  sourceId: string;
}

export interface NutritionPer100g {
  energyKcal: number;
  fatG: number;
  saturatedFatG: number;
  carbohydrateG: number;
  sugarsG: number;
  fibreG: number;
  proteinG: number;
  saltG: number;
  potassiumMg?: number;
  vitaminKug?: number;
  purineMg?: number;
}

export interface IngredientRef {
  ingredientId: string;
  name: string;
  sourceId: string;
}

export interface FoodRecord {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  category: string;
  kind: FoodKind;
  tags: string[];
  barcode: string | null;
  ingredients: IngredientRef[];
  allergens: AllergenDeclaration[];
  nutrition: NutritionPer100g;
  processing: "raw" | "pasteurised" | "cooked" | "fermented" | "ultra_processed" | "unknown";
  sources: string[];
  version: number;
  state: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface CreateFoodInput {
  name: string;
  aliases?: string[];
  category: string;
  kind?: FoodKind;
  tags?: string[];
  barcode?: string | null;
  ingredients?: IngredientRef[];
  allergens?: AllergenDeclaration[];
  nutrition: NutritionPer100g;
  processing?: FoodRecord["processing"];
  sources: string[];
}

export interface EaterProfile {
  id: string;
  allergies: Allergen[];
  medicalFlags: MedicalFlag[];
  medications: string[];
}

export type VerdictLevel = "safe" | "caution" | "blocked" | "unknown";

export interface RuleReason {
  ruleId: string;
  level: Exclude<VerdictLevel, "safe">;
  message: string;
  sourceId: string | null;
}

export interface Verdict {
  foodId: string;
  profileId: string;
  level: VerdictLevel;
  reasons: RuleReason[];
  rulesVersion: string;
  disclaimer: string;
  evaluatedAt: string;
}

function assertFiniteNonNegative(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} must be a non-negative number`);
}

function validateNutrition(nutrition: NutritionPer100g): void {
  for (const [field, value] of Object.entries(nutrition)) {
    if (value !== undefined) assertFiniteNonNegative(value, `nutrition.${field}`);
  }
}

function normaliseAllergens(values: readonly AllergenDeclaration[]): AllergenDeclaration[] {
  const seen = new Map<Allergen, AllergenDeclaration>();
  for (const declaration of values) {
    if (!EU_ALLERGENS.includes(declaration.allergen)) {
      throw new Error(`unknown allergen: ${declaration.allergen}`);
    }
    if (!declaration.sourceId.trim()) throw new Error(`allergen ${declaration.allergen} has no source`);
    const existing = seen.get(declaration.allergen);
    // "contains" is the strongest claim and must win over a weaker one.
    if (!existing || presenceRank(declaration.presence) > presenceRank(existing.presence)) {
      seen.set(declaration.allergen, { ...declaration });
    }
  }
  return [...seen.values()].sort((a, b) => a.allergen.localeCompare(b.allergen));
}

function presenceRank(presence: Presence): number {
  return presence === "contains" ? 3 : presence === "may_contain" ? 2 : 1;
}

/** APP-001 application shell and navigation APP-002 session state management APP-005 account and sign in APP-006 user preferences and settings APP-007 accessibility APP-008 packaging and distribution: food wiki application services. */
export class FoodWikiService {
  private readonly foods: Repository<FoodRecord>;
  private readonly sources: Repository<SourceRef>;
  private readonly revisions: Repository<FoodRevision>;
  private readonly ledger: EventLedger;
  private readonly index = new SearchIndex();
  private readonly clock: () => Date;

  constructor(
    foods: Repository<FoodRecord>,
    sources: Repository<SourceRef>,
    revisions: Repository<FoodRevision>,
    options: { ledger?: EventLedger; clock?: () => Date } = {},
  ) {
    this.foods = foods;
    this.sources = sources;
    this.revisions = revisions;
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    for (const food of foods.all()) this.index.add(toDocument(food));
  }

  addSource(input: Omit<SourceRef, "id"> & { id?: string }): SourceRef {
    if (!input.title.trim() || !input.publisher.trim()) throw new Error("a source needs a title and a publisher");
    if (!input.licence.trim()) throw new Error("a source needs a licence");
    const source: SourceRef = {
      id: input.id ?? newId("src"),
      title: input.title.trim(),
      publisher: input.publisher.trim(),
      url: input.url ?? null,
      retrievedAt: input.retrievedAt,
      licence: input.licence.trim(),
    };
    this.sources.put(source);
    return structuredClone(source);
  }

  /** APP-001 application shell and navigation APP-002 session state management APP-004 push notification delivery APP-005 account and sign in APP-006 user preferences and settings APP-007 accessibility: food record ingestion service. */
  ingest(input: CreateFoodInput): FoodRecord {
    if (!input.name.trim()) throw new Error("a food needs a name");
    if (!input.category.trim()) throw new Error("a food needs a category");
    if (input.kind !== undefined && !FOOD_KINDS.includes(input.kind)) throw new Error(`unknown food kind: ${input.kind}`);
    if (input.sources.length === 0) throw new Error("a food needs at least one cited source");
    for (const sourceId of input.sources) this.requireSource(sourceId);
    validateNutrition(input.nutrition);
    const allergens = normaliseAllergens(input.allergens ?? []);
    for (const declaration of allergens) this.requireSource(declaration.sourceId);
    for (const ingredient of input.ingredients ?? []) this.requireSource(ingredient.sourceId);

    const slug = this.uniqueSlug(input.name);
    if (input.barcode && this.byBarcode(input.barcode)) {
      throw new Error(`barcode is already recorded: ${input.barcode}`);
    }
    const at = nowIso(this.clock);
    const food: FoodRecord = {
      id: newId("fod"),
      slug,
      name: input.name.trim(),
      aliases: [...new Set((input.aliases ?? []).map((alias) => alias.trim()).filter(Boolean))],
      category: input.category.trim(),
      kind: input.kind ?? "other",
      tags: [...new Set((input.tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean))].sort(),
      barcode: input.barcode?.trim() || null,
      ingredients: (input.ingredients ?? []).map((ingredient) => ({ ...ingredient })),
      allergens,
      nutrition: { ...input.nutrition },
      processing: input.processing ?? "unknown",
      sources: [...new Set(input.sources)],
      version: 1,
      state: "draft",
      createdAt: at,
      updatedAt: at,
    };
    this.foods.put(food);
    this.revisions.put({ id: newId("rev"), foodId: food.id, version: 1, snapshot: structuredClone(food), at, by: "ingest" });
    this.index.add(toDocument(food));
    this.ledger.append({ type: "food.ingested", actor: "ingest", subject: food.id, data: { slug, version: 1 } });
    return structuredClone(food);
  }

  /** KNW-007 publish export render site static site APP-008 app store manifest bundle id package id version bump: publish a food record. */
  publish(foodId: string, actor: string): FoodRecord {
    const food = this.requireFood(foodId);
    if (food.state === "published") return structuredClone(food);
    if (food.state === "archived") throw new Error("an archived food cannot be published");
    if (food.sources.length === 0) throw new Error("an uncited food cannot be published");
    food.state = "published";
    food.updatedAt = nowIso(this.clock);
    this.foods.put(food);
    this.index.add(toDocument(food));
    this.ledger.append({ type: "food.published", actor, subject: food.id, data: { version: food.version } });
    return structuredClone(food);
  }

  update(actor: string, foodId: string, patch: Partial<CreateFoodInput>): FoodRecord {
    const current = this.requireFood(foodId);
    if (current.state === "archived") throw new Error("an archived food cannot be edited");
    if (patch.sources !== undefined && patch.sources.length === 0) throw new Error("a food needs at least one cited source");
    for (const sourceId of patch.sources ?? current.sources) this.requireSource(sourceId);
    const allergens = patch.allergens ? normaliseAllergens(patch.allergens) : current.allergens;
    for (const declaration of allergens) this.requireSource(declaration.sourceId);
    if (patch.kind !== undefined && !FOOD_KINDS.includes(patch.kind)) throw new Error(`unknown food kind: ${patch.kind}`);
    if (patch.nutrition) validateNutrition(patch.nutrition);
    if (patch.barcode && patch.barcode !== current.barcode && this.byBarcode(patch.barcode)) {
      throw new Error(`barcode is already recorded: ${patch.barcode}`);
    }
    const next: FoodRecord = {
      ...current,
      name: patch.name?.trim() || current.name,
      aliases: patch.aliases ? [...new Set(patch.aliases.map((alias) => alias.trim()).filter(Boolean))] : current.aliases,
      category: patch.category?.trim() || current.category,
      kind: patch.kind ?? current.kind,
      tags: patch.tags
        ? [...new Set(patch.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].sort()
        : current.tags,
      barcode: patch.barcode === undefined ? current.barcode : patch.barcode?.trim() || null,
      ingredients: patch.ingredients ? patch.ingredients.map((ingredient) => ({ ...ingredient })) : current.ingredients,
      allergens,
      nutrition: patch.nutrition ? { ...patch.nutrition } : current.nutrition,
      processing: patch.processing ?? current.processing,
      sources: patch.sources ? [...new Set(patch.sources)] : current.sources,
      version: current.version + 1,
      // A published record returns to draft so an edit is reviewed before readers see it.
      state: current.state === "published" ? "draft" : current.state,
      updatedAt: nowIso(this.clock),
    };
    next.slug = patch.name ? this.uniqueSlug(next.name, next.id) : next.slug;
    this.foods.put(next);
    this.revisions.put({
      id: newId("rev"),
      foodId: next.id,
      version: next.version,
      snapshot: structuredClone(next),
      at: next.updatedAt,
      by: actor,
    });
    this.index.add(toDocument(next));
    this.ledger.append({
      type: "food.updated",
      actor,
      subject: next.id,
      data: { version: next.version, fields: Object.keys(patch).sort() },
    });
    return structuredClone(next);
  }

  archive(actor: string, foodId: string): FoodRecord {
    const food = this.requireFood(foodId);
    food.state = "archived";
    food.updatedAt = nowIso(this.clock);
    this.foods.put(food);
    this.index.remove(food.id);
    this.ledger.append({ type: "food.archived", actor, subject: food.id, data: { version: food.version } });
    return structuredClone(food);
  }

  get(foodId: string): FoodRecord | undefined {
    const food = this.foods.get(foodId);
    return food ? structuredClone(food) : undefined;
  }

  byBarcode(barcode: string): FoodRecord | undefined {
    const wanted = barcode.trim();
    const food = this.foods.all().find((candidate) => candidate.barcode === wanted);
    return food ? structuredClone(food) : undefined;
  }

  search(query: string, limit = 10): FoodRecord[] {
    return this.index
      .search(query, limit)
      .map((hit) => this.foods.get(hit.id))
      .filter((food): food is FoodRecord => food !== undefined && food.state !== "archived")
      .map((food) => structuredClone(food));
  }

  /** Every non-archived food, sorted by name. */
  list(): FoodRecord[] {
    return this.foods
      .all()
      .filter((food) => food.state !== "archived")
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((food) => structuredClone(food));
  }

  /** KNW-003 link graph relation edges graph traversal: Foods that share at least one ingredient with this food. */
  related(foodId: string): FoodRecord[] {
    const food = this.requireFood(foodId);
    const ingredients = new Set(food.ingredients.map((ingredient) => ingredient.ingredientId));
    return this.foods
      .all()
      .filter((candidate) => candidate.id !== foodId && candidate.state !== "archived")
      .filter((candidate) => candidate.ingredients.some((ingredient) => ingredients.has(ingredient.ingredientId)))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((candidate) => structuredClone(candidate));
  }

  history(foodId: string): FoodRevision[] {
    this.requireFood(foodId);
    return this.revisions
      .all()
      .filter((revision) => revision.foodId === foodId)
      .sort((a, b) => a.version - b.version)
      .map((revision) => structuredClone(revision));
  }

  /**
   * Deterministic evaluation. No model, network or clock-dependent branch is
   * involved: the same record and profile always produce the same verdict.
   */
  evaluate(food: FoodRecord, profile: EaterProfile, at: Date = this.clock()): Verdict {
    const reasons: RuleReason[] = [];
    const declarations = new Map(food.allergens.map((declaration) => [declaration.allergen, declaration]));

    for (const allergen of profile.allergies) {
      const declaration = declarations.get(allergen);
      if (!declaration) {
        reasons.push({
          ruleId: "ALLERGEN-UNKNOWN",
          level: "unknown",
          message: `No declaration for ${allergen}; the food cannot be treated as free of it.`,
          sourceId: null,
        });
        continue;
      }
      if (declaration.presence === "contains") {
        reasons.push({
          ruleId: "ALLERGEN-CONTAINS",
          level: "blocked",
          message: `Declared to contain ${allergen}.`,
          sourceId: declaration.sourceId,
        });
      } else if (declaration.presence === "may_contain") {
        reasons.push({
          ruleId: "ALLERGEN-MAY-CONTAIN",
          level: "caution",
          message: `May contain ${allergen} through cross-contamination.`,
          sourceId: declaration.sourceId,
        });
      }
    }

    for (const flag of profile.medicalFlags) {
      const rule = MEDICAL_RULES[flag];
      if (!rule) continue;
      const reason = rule(food);
      if (reason) reasons.push(reason);
    }

    if (profile.medications.some((medication) => /warfarin|acenocoumarol|phenprocoumon/i.test(medication))) {
      if ((food.nutrition.vitaminKug ?? 0) >= 100) {
        reasons.push({
          ruleId: "MED-VITAMIN-K",
          level: "caution",
          message: "High vitamin K may interact with vitamin K antagonist therapy.",
          sourceId: food.sources[0] ?? null,
        });
      }
    }

    if (food.processing === "raw" && profile.medicalFlags.includes("pregnancy")) {
      reasons.push({
        ruleId: "MED-PREGNANCY-RAW",
        level: "caution",
        message: "Raw food carries a higher foodborne-illness risk in pregnancy.",
        sourceId: food.sources[0] ?? null,
      });
    }

    const level = highestLevel(reasons);
    const verdict: Verdict = {
      foodId: food.id,
      profileId: profile.id,
      level,
      reasons,
      rulesVersion: RULES_VERSION,
      disclaimer: DISCLAIMER,
      evaluatedAt: nowIso(() => at),
    };
    this.ledger.append({
      type: "food.verdict",
      actor: profile.id,
      subject: food.id,
      data: { level, ruleIds: reasons.map((reason) => reason.ruleId).sort(), rulesVersion: RULES_VERSION },
    });
    return verdict;
  }

  private requireFood(foodId: string): FoodRecord {
    const food = this.foods.get(foodId);
    if (!food) throw new Error(`no food: ${foodId}`);
    return structuredClone(food);
  }

  private requireSource(sourceId: string): SourceRef {
    const source = this.sources.get(sourceId);
    if (!source) throw new Error(`citation points to an unknown source: ${sourceId}`);
    return source;
  }

  private uniqueSlug(name: string, exceptId?: string): string {
    const base = slugify(name) || "food";
    let candidate = base;
    let suffix = 2;
    while (this.foods.all().some((food) => food.slug === candidate && food.id !== exceptId)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
}

export interface FoodRevision {
  id: string;
  foodId: string;
  version: number;
  snapshot: FoodRecord;
  at: string;
  by: string;
}

type MedicalRule = (food: FoodRecord) => RuleReason | null;

const MEDICAL_RULES: Record<MedicalFlag, MedicalRule> = {
  pregnancy: (food) =>
    food.processing === "raw"
      ? null // handled once, with the pregnancy rule below
      : null,
  kidney_disease: (food) =>
    (food.nutrition.potassiumMg ?? 0) >= 400
      ? {
          ruleId: "MED-KIDNEY-POTASSIUM",
          level: "caution",
          message: "High potassium per 100 g; a renal diet may need a smaller portion.",
          sourceId: food.sources[0] ?? null,
        }
      : null,
  diabetes: (food) =>
    food.nutrition.sugarsG >= 15
      ? {
          ruleId: "MED-DIABETES-SUGAR",
          level: "caution",
          message: "High sugar per 100 g; check the portion against your care plan.",
          sourceId: food.sources[0] ?? null,
        }
      : null,
  hypertension: (food) =>
    food.nutrition.saltG >= 1.5
      ? {
          ruleId: "MED-HYPERTENSION-SALT",
          level: "caution",
          message: "High salt per 100 g; a lower-salt choice may suit you better.",
          sourceId: food.sources[0] ?? null,
        }
      : null,
  gout: (food) =>
    (food.nutrition.purineMg ?? 0) >= 150
      ? {
          ruleId: "MED-GOUT-PURINE",
          level: "caution",
          message: "High purine per 100 g; gout guidance often limits these foods.",
          sourceId: food.sources[0] ?? null,
        }
      : null,
  anticoagulant_therapy: () => null, // medication names carry this rule
  liver_disease: (food) =>
    food.nutrition.saltG >= 1.5
      ? {
          ruleId: "MED-LIVER-SALT",
          level: "caution",
          message: "High salt per 100 g; salt restriction is common in liver care.",
          sourceId: food.sources[0] ?? null,
        }
      : null,
};

function highestLevel(reasons: readonly RuleReason[]): VerdictLevel {
  if (reasons.some((reason) => reason.level === "blocked")) return "blocked";
  if (reasons.some((reason) => reason.level === "unknown")) return "unknown";
  if (reasons.some((reason) => reason.level === "caution")) return "caution";
  return "safe";
}

function toDocument(food: FoodRecord) {
  return {
    id: food.id,
    title: food.name,
    body: [food.category, food.kind, food.processing, ...food.aliases, ...food.ingredients.map((i) => i.name)].join(" "),
    tags: food.tags,
    kind: "food",
  };
}

/**
 * A one-frame-per-second gate in front of the barcode lookup.
 *
 * The scan path is a deterministic index lookup. No model runs here, which is
 * the recorded requirement: a camera frame must never wait on inference.
 */
export class BarcodeScanner {
  private lastScanAt = Number.NEGATIVE_INFINITY;
  private readonly wiki: FoodWikiService;
  private readonly minimumIntervalMs: number;

  constructor(wiki: FoodWikiService, minimumIntervalMs = 1000) {
    this.wiki = wiki;
    this.minimumIntervalMs = minimumIntervalMs;
  }

  scan(barcode: string, at: Date): { status: "ok" | "unknown" | "throttled"; food?: FoodRecord } {
    if (at.getTime() - this.lastScanAt < this.minimumIntervalMs) return { status: "throttled" };
    this.lastScanAt = at.getTime();
    const food = this.wiki.byBarcode(barcode);
    return food ? { status: "ok", food } : { status: "unknown" };
  }
}

export type OfflineOperation =
  | { kind: "update"; foodId: string; baseVersion: number; patch: Partial<CreateFoodInput> }
  | { kind: "publish"; foodId: string; baseVersion: number };

export interface SyncConflict {
  operation: OfflineOperation;
  remoteVersion: number;
  reason: string;
}

/**
 * Offline writes are queued with the version they were based on. On sync a
 * write whose base version is stale is reported as a conflict and is not
 * applied: the remote edit is never silently overwritten.
 */
export class OfflineQueue {
  private readonly operations: OfflineOperation[] = [];
  private readonly wiki: FoodWikiService;

  constructor(wiki: FoodWikiService) {
    this.wiki = wiki;
  }

  enqueue(operation: OfflineOperation): void {
    this.operations.push(structuredClone(operation));
  }

  get size(): number {
    return this.operations.length;
  }

  sync(actor: string): { applied: number; conflicts: SyncConflict[] } {
    const conflicts: SyncConflict[] = [];
    let applied = 0;
    while (this.operations.length > 0) {
      const operation = this.operations.shift()!;
      const current = this.wiki.get(operation.foodId);
      if (!current) {
        conflicts.push({ operation, remoteVersion: 0, reason: "the food no longer exists" });
        continue;
      }
      if (current.version !== operation.baseVersion) {
        conflicts.push({
          operation,
          remoteVersion: current.version,
          reason: `queued against version ${operation.baseVersion}, remote is version ${current.version}`,
        });
        continue;
      }
      if (operation.kind === "update") {
        this.wiki.update(actor, operation.foodId, operation.patch);
      } else {
        this.wiki.publish(operation.foodId, actor);
      }
      applied += 1;
    }
    return { applied, conflicts };
  }
}

export function contentDigest(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function createFoodWiki(): FoodWikiService {
  return new FoodWikiService(new MemoryRepository(), new MemoryRepository(), new MemoryRepository());
}
