import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";
import type { ToolDefinition } from "../../Athena/src/athena.ts";
import { EU_ALLERGENS, FOOD_KINDS } from "./foodWiki.ts";
import type {
  Allergen,
  EaterProfile,
  FoodKind,
  FoodRecord,
  FoodWikiService,
  MedicalFlag,
} from "./foodWiki.ts";

/**
 * Food Wiki product layer.
 *
 * The original domain slice answered "what is in this food and is it safe for
 * me". This module adds the four product capabilities the owner asked for:
 * where a food is found, what can be cooked with it, a photo-assisted recipe
 * suggestion path, and Rife-style frequency protocols. It also provides the
 * app's navigation/session/preferences state and the tools Athena uses to read
 * the wiki.
 *
 * Two boundaries are deliberate and stated in the README:
 *   - photo suggestions consume labels from a caller-supplied classifier; this
 *     module does not run a vision model and does not claim to recognise food
 *     from pixels;
 *   - Rife-style frequencies are not evidence-based medicine. The generated
 *     tone is real audio; the health claim is not.
 */

export const PHOTO_NOTE =
  "Detections are supplied by the caller. This module does not run a vision model and does not claim to recognise food from pixels.";

export const RIFE_DISCLAIMER =
  "Rife-style frequency claims are not supported by robust clinical evidence. " +
  "These tones are provided for personal exploration only and are not a medical treatment, diagnosis or cure.";

/* ---------------------------------------------------------------- locations */

export const LOCATION_KINDS = ["wild", "shop", "market", "garden", "online", "foraged"] as const;
export type LocationKind = (typeof LOCATION_KINDS)[number];

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface FoodLocation {
  id: string;
  foodId: string;
  kind: LocationKind;
  name: string;
  region: string;
  address: string | null;
  coordinates: GeoPoint | null;
  /** Empty means available all year; otherwise 1-12, sorted and unique. */
  seasonMonths: number[];
  notes: string;
  sourceId: string;
  createdAt: string;
}

export interface AddLocationInput {
  foodId: string;
  kind: LocationKind;
  name: string;
  region: string;
  address?: string | null;
  coordinates?: GeoPoint | null;
  seasonMonths?: number[];
  notes?: string;
  sourceId: string;
}

export interface LocationOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class LocationAtlas {
  private readonly locations = new Map<string, FoodLocation>();
  private readonly wiki: FoodWikiService;
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(wiki: FoodWikiService, options: LocationOptions = {}) {
    this.wiki = wiki;
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  add(input: AddLocationInput): FoodLocation {
    if (!this.wiki.get(input.foodId)) throw new Error(`no food: ${input.foodId}`);
    if (!LOCATION_KINDS.includes(input.kind)) throw new Error(`unknown location kind: ${input.kind}`);
    if (!input.name.trim() || !input.region.trim()) throw new Error("a location needs a name and a region");
    if (!input.sourceId.trim()) throw new Error("a location needs a cited source");
    const coordinates = input.coordinates ?? null;
    if (coordinates) {
      if (!Number.isFinite(coordinates.lat) || coordinates.lat < -90 || coordinates.lat > 90) {
        throw new Error(`latitude is out of range: ${coordinates.lat}`);
      }
      if (!Number.isFinite(coordinates.lon) || coordinates.lon < -180 || coordinates.lon > 180) {
        throw new Error(`longitude is out of range: ${coordinates.lon}`);
      }
    }
    const seasonMonths = [...new Set(input.seasonMonths ?? [])].sort((a, b) => a - b);
    for (const month of seasonMonths) {
      if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error(`month is out of range: ${month}`);
    }
    const duplicate = [...this.locations.values()].some(
      (location) =>
        location.foodId === input.foodId &&
        location.name.trim().toLowerCase() === input.name.trim().toLowerCase() &&
        location.region.trim().toLowerCase() === input.region.trim().toLowerCase(),
    );
    if (duplicate) throw new Error(`location is already recorded: ${input.name} (${input.region})`);

    const location: FoodLocation = {
      id: newId("loc"),
      foodId: input.foodId,
      kind: input.kind,
      name: input.name.trim(),
      region: input.region.trim(),
      address: input.address?.trim() || null,
      coordinates: coordinates ? { ...coordinates } : null,
      seasonMonths,
      notes: input.notes?.trim() ?? "",
      sourceId: input.sourceId.trim(),
      createdAt: nowIso(this.clock),
    };
    this.locations.set(location.id, location);
    this.ledger.append({
      type: "food.location.added",
      actor: "atlas",
      subject: input.foodId,
      data: { kind: location.kind, region: location.region },
    });
    return structuredClone(location);
  }

  /** Locations for a food, optionally only those in season during a month. */
  locationsFor(foodId: string, month?: number): FoodLocation[] {
    if (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12)) {
      throw new Error(`month is out of range: ${month}`);
    }
    return [...this.locations.values()]
      .filter((location) => location.foodId === foodId)
      .filter((location) => month === undefined || location.seasonMonths.length === 0 || location.seasonMonths.includes(month))
      .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name))
      .map((location) => structuredClone(location));
  }

  /** Foods with at least one location in the region (case-insensitive substring). */
  foodsInRegion(region: string): FoodRecord[] {
    const wanted = region.trim().toLowerCase();
    if (!wanted) throw new Error("a region is required");
    const foodIds = new Set(
      [...this.locations.values()]
        .filter((location) => location.region.toLowerCase().includes(wanted))
        .map((location) => location.foodId),
    );
    return this.wiki
      .list()
      .filter((food) => foodIds.has(food.id))
      .map((food) => structuredClone(food));
  }

  byKind(kind: FoodKind): FoodRecord[] {
    if (!FOOD_KINDS.includes(kind)) throw new Error(`unknown food kind: ${kind}`);
    return this.wiki.list().filter((food) => food.kind === kind);
  }
}

/* ------------------------------------------------------------------ recipes */

export interface RecipeIngredient {
  foodId: string | null;
  name: string;
  quantity: number;
  unit: string;
  optional?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
  timeMinutes: number;
  sourceId: string;
  createdAt: string;
}

export interface AddRecipeInput {
  title: string;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags?: string[];
  timeMinutes: number;
  sourceId: string;
}

export interface RecipeSuggestion {
  recipe: Recipe;
  matched: string[];
  missing: string[];
  coverage: number;
}

export interface PhotoDetection {
  label: string;
  confidence: number;
}

export interface PhotoMatch {
  label: string;
  confidence: number;
  foodId: string | null;
}

export interface PhotoSuggestionResult {
  detections: PhotoMatch[];
  unmatched: string[];
  suggestions: RecipeSuggestion[];
  note: string;
}

export class RecipeBook {
  private readonly recipes = new Map<string, Recipe>();
  private readonly wiki: FoodWikiService;
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(wiki: FoodWikiService, options: LocationOptions = {}) {
    this.wiki = wiki;
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  add(input: AddRecipeInput): Recipe {
    if (!input.title.trim()) throw new Error("a recipe needs a title");
    if (!Number.isInteger(input.servings) || input.servings < 1 || input.servings > 50) {
      throw new Error(`servings is out of range: ${input.servings}`);
    }
    if (!Number.isInteger(input.timeMinutes) || input.timeMinutes < 1 || input.timeMinutes > 1440) {
      throw new Error(`timeMinutes is out of range: ${input.timeMinutes}`);
    }
    if (!input.sourceId.trim()) throw new Error("a recipe needs a cited source");
    if (input.ingredients.length < 2) throw new Error("a recipe needs at least two ingredients");
    if (input.steps.length === 0 || input.steps.some((step) => !step.trim())) {
      throw new Error("a recipe needs at least one non-empty step");
    }

    const ingredients: RecipeIngredient[] = input.ingredients.map((ingredient) => {
      if (!ingredient.name.trim()) throw new Error("an ingredient needs a name");
      if (!Number.isFinite(ingredient.quantity) || ingredient.quantity <= 0) {
        throw new Error(`ingredient quantity is out of range: ${ingredient.quantity}`);
      }
      if (!ingredient.unit.trim()) throw new Error(`ingredient ${ingredient.name} needs a unit`);
      if (ingredient.foodId && !this.wiki.get(ingredient.foodId)) {
        throw new Error(`ingredient points to an unknown food: ${ingredient.foodId}`);
      }
      return {
        foodId: ingredient.foodId,
        name: ingredient.name.trim(),
        quantity: ingredient.quantity,
        unit: ingredient.unit.trim(),
        optional: ingredient.optional === true,
      };
    });

    const recipe: Recipe = {
      id: newId("rec"),
      title: input.title.trim(),
      servings: input.servings,
      ingredients,
      steps: input.steps.map((step) => step.trim()),
      tags: [...new Set((input.tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean))].sort(),
      timeMinutes: input.timeMinutes,
      sourceId: input.sourceId.trim(),
      createdAt: nowIso(this.clock),
    };
    this.recipes.set(recipe.id, recipe);
    this.ledger.append({ type: "food.recipe.added", actor: "recipes", subject: recipe.id, data: { title: recipe.title } });
    return structuredClone(recipe);
  }

  get(recipeId: string): Recipe | undefined {
    const recipe = this.recipes.get(recipeId);
    return recipe ? structuredClone(recipe) : undefined;
  }

  list(): Recipe[] {
    return [...this.recipes.values()].sort((a, b) => a.title.localeCompare(b.title)).map((r) => structuredClone(r));
  }

  /** Recipes ranked by how many of their required ingredients are available. */
  recipesFor(foodIds: readonly string[], limit = 10): RecipeSuggestion[] {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error(`limit is out of range: ${limit}`);
    const available = new Set(foodIds);
    const suggestions: RecipeSuggestion[] = [];
    for (const recipe of this.recipes.values()) {
      const required = recipe.ingredients.filter((ingredient) => !ingredient.optional && ingredient.foodId !== null);
      if (required.length === 0) continue;
      const matched = required.filter((ingredient) => available.has(ingredient.foodId!)).map((ingredient) => ingredient.name);
      const missing = required.filter((ingredient) => !available.has(ingredient.foodId!)).map((ingredient) => ingredient.name);
      if (matched.length === 0) continue;
      suggestions.push({
        recipe: structuredClone(recipe),
        matched: [...new Set(matched)].sort(),
        missing: [...new Set(missing)].sort(),
        coverage: matched.length / required.length,
      });
    }
    return suggestions
      .sort((a, b) => b.coverage - a.coverage || a.missing.length - b.missing.length || a.recipe.title.localeCompare(b.recipe.title))
      .slice(0, limit);
  }

  /**
   * Turn caller-supplied photo detections into recipe suggestions. A label is
   * matched by exact name, alias or slug first, then by the wiki search index.
   */
  suggestFromPhoto(detections: readonly PhotoDetection[], options: { minConfidence?: number; limit?: number } = {}): PhotoSuggestionResult {
    const minConfidence = options.minConfidence ?? 0.5;
    if (!Number.isFinite(minConfidence) || minConfidence < 0 || minConfidence > 1) {
      throw new Error(`minConfidence is out of range: ${minConfidence}`);
    }
    const matches: PhotoMatch[] = [];
    const unmatched: string[] = [];
    const foodIds = new Set<string>();
    for (const detection of detections) {
      if (!detection.label.trim()) throw new Error("a detection needs a label");
      if (!Number.isFinite(detection.confidence) || detection.confidence < 0 || detection.confidence > 1) {
        throw new Error(`confidence is out of range: ${detection.confidence}`);
      }
      if (detection.confidence < minConfidence) continue;
      const food = this.foodForLabel(detection.label);
      matches.push({ label: detection.label.trim(), confidence: detection.confidence, foodId: food?.id ?? null });
      if (food) foodIds.add(food.id);
      else unmatched.push(detection.label.trim());
    }
    return {
      detections: matches,
      unmatched,
      suggestions: this.recipesFor([...foodIds], options.limit ?? 5),
      note: PHOTO_NOTE,
    };
  }

  private foodForLabel(label: string): FoodRecord | null {
    const wanted = label.trim().toLowerCase();
    const exact = this.wiki
      .list()
      .find(
        (food) =>
          food.name.toLowerCase() === wanted ||
          food.slug === wanted ||
          food.aliases.some((alias) => alias.toLowerCase() === wanted),
      );
    if (exact) return exact;
    return this.wiki.search(label, 1)[0] ?? null;
  }
}

/* -------------------------------------------------------------- frequencies */

export interface FrequencyProtocol {
  id: string;
  name: string;
  frequencyHz: number;
  durationSeconds: number;
  description: string;
  evidenceNote: string;
  sourceId: string;
}

export interface AddFrequencyInput {
  name: string;
  frequencyHz: number;
  durationSeconds: number;
  description: string;
  evidenceNote: string;
  sourceId: string;
}

export interface FrequencyOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

const EVIDENCE_NOTE = "No robust clinical evidence supports this Rife-style frequency claim.";

/**
 * A small library of Rife-style protocols. These are the frequencies that
 * appear repeatedly in the popular literature; the library records them as
 * cultural artefacts, not as treatments.
 */
export const BUILT_IN_FREQUENCIES: readonly FrequencyProtocol[] = [
  {
    id: "freq-727",
    name: "Rife 727 Hz",
    frequencyHz: 727,
    durationSeconds: 180,
    description: "A Rife-style tone often listed for general wellbeing in popular material.",
    evidenceNote: EVIDENCE_NOTE,
    sourceId: "rife-popular-literature",
  },
  {
    id: "freq-787",
    name: "Rife 787 Hz",
    frequencyHz: 787,
    durationSeconds: 180,
    description: "A Rife-style tone associated with the 727/787/880/2008 sequence in popular material.",
    evidenceNote: EVIDENCE_NOTE,
    sourceId: "rife-popular-literature",
  },
  {
    id: "freq-880",
    name: "Rife 880 Hz",
    frequencyHz: 880,
    durationSeconds: 180,
    description: "A Rife-style tone often described as 'cellular' in popular material.",
    evidenceNote: EVIDENCE_NOTE,
    sourceId: "rife-popular-literature",
  },
  {
    id: "freq-5000",
    name: "Rife 5000 Hz",
    frequencyHz: 5000,
    durationSeconds: 120,
    description: "A higher Rife-style tone used in some published frequency lists.",
    evidenceNote: EVIDENCE_NOTE,
    sourceId: "rife-popular-literature",
  },
];

export class FrequencyLibrary {
  private readonly protocols = new Map<string, FrequencyProtocol>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: FrequencyOptions & { seed?: readonly FrequencyProtocol[] } = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    for (const protocol of options.seed ?? BUILT_IN_FREQUENCIES) this.addExisting(protocol);
  }

  add(input: AddFrequencyInput): FrequencyProtocol {
    if (!input.name.trim() || !input.description.trim()) throw new Error("a frequency needs a name and a description");
    if (!input.evidenceNote.trim()) throw new Error("a frequency needs an evidence note");
    if (!input.sourceId.trim()) throw new Error("a frequency needs a cited source");
    if (!Number.isFinite(input.frequencyHz) || input.frequencyHz < 20 || input.frequencyHz > 20000) {
      throw new Error(`frequency is out of the audible range: ${input.frequencyHz}`);
    }
    if (!Number.isFinite(input.durationSeconds) || input.durationSeconds < 1 || input.durationSeconds > 600) {
      throw new Error(`duration is out of range: ${input.durationSeconds}`);
    }
    const protocol: FrequencyProtocol = {
      id: newId("freq"),
      name: input.name.trim(),
      frequencyHz: input.frequencyHz,
      durationSeconds: input.durationSeconds,
      description: input.description.trim(),
      evidenceNote: input.evidenceNote.trim(),
      sourceId: input.sourceId.trim(),
    };
    this.protocols.set(protocol.id, protocol);
    this.ledger.append({
      type: "food.frequency.added",
      actor: "frequencies",
      subject: protocol.id,
      data: { frequencyHz: protocol.frequencyHz },
    });
    return structuredClone(protocol);
  }

  get(id: string): FrequencyProtocol | undefined {
    const protocol = this.protocols.get(id);
    return protocol ? structuredClone(protocol) : undefined;
  }

  list(): FrequencyProtocol[] {
    return [...this.protocols.values()]
      .sort((a, b) => a.frequencyHz - b.frequencyHz || a.name.localeCompare(b.name))
      .map((protocol) => structuredClone(protocol));
  }

  private addExisting(protocol: FrequencyProtocol): void {
    this.protocols.set(protocol.id, { ...protocol });
  }
}

export interface ToneOptions {
  sampleRate?: number;
  amplitude?: number;
  durationSeconds?: number;
}

/**
 * Render a protocol to a 16-bit mono PCM WAV buffer. This is real audio
 * synthesis: a sine wave with a 10 ms fade in and out to avoid clicks. It does
 * not play the buffer; the host owns audio output.
 */
export function renderToneWav(protocol: FrequencyProtocol, options: ToneOptions = {}): Buffer {
  const sampleRate = options.sampleRate ?? 44100;
  const amplitude = options.amplitude ?? 0.25;
  const duration = options.durationSeconds ?? protocol.durationSeconds;
  if (!Number.isInteger(sampleRate) || sampleRate < 8000 || sampleRate > 192000) {
    throw new Error(`sampleRate is out of range: ${sampleRate}`);
  }
  if (!Number.isFinite(amplitude) || amplitude <= 0 || amplitude > 1) {
    throw new Error(`amplitude is out of range: ${amplitude}`);
  }
  if (!Number.isFinite(duration) || duration <= 0 || duration > 600) {
    throw new Error(`duration is out of range: ${duration}`);
  }

  const total = Math.round(sampleRate * duration);
  const data = Buffer.alloc(total * 2);
  const fade = Math.min(Math.floor(sampleRate * 0.01), Math.floor(total / 2));
  for (let index = 0; index < total; index += 1) {
    let envelope = 1;
    if (fade > 0) {
      if (index < fade) envelope = index / fade;
      else if (index >= total - fade) envelope = (total - 1 - index) / fade;
    }
    const sample = Math.sin((2 * Math.PI * protocol.frequencyHz * index) / sampleRate) * amplitude * envelope;
    data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(sample * 32767))), index * 2);
  }

  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

/* ---------------------------------------------------------------- app state */

export const NAVIGATION_SCREENS = ["home", "search", "food", "recipe", "scanner", "map", "rife", "settings"] as const;
export type NavigationScreen = (typeof NAVIGATION_SCREENS)[number];

export interface NavigationRoute {
  screen: NavigationScreen;
  foodId?: string;
  recipeId?: string;
  query?: string;
}

export interface UserAccount {
  id: string;
  displayName: string;
  email: string | null;
  createdAt: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  units: "metric" | "imperial";
  locale: string;
  reduceMotion: boolean;
  highContrast: boolean;
  warningsOnly: boolean;
  athenaHandoff: boolean;
}

export interface UserState {
  account: UserAccount | null;
  route: NavigationRoute;
  history: NavigationRoute[];
  preferences: UserPreferences;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  units: "metric",
  locale: "en-GB",
  reduceMotion: false,
  highContrast: false,
  warningsOnly: false,
  athenaHandoff: true,
};

export interface AppOptions {
  ledger?: EventLedger;
  clock?: () => Date;
  recipes?: RecipeBook;
  initialPreferences?: Partial<UserPreferences>;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCALE = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;

export class FoodWikiApp {
  private readonly wiki: FoodWikiService;
  private readonly recipes: RecipeBook | undefined;
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;
  private account: UserAccount | null = null;
  private route: NavigationRoute = { screen: "home" };
  private history: NavigationRoute[] = [];
  private preferences: UserPreferences;

  constructor(wiki: FoodWikiService, options: AppOptions = {}) {
    this.wiki = wiki;
    this.recipes = options.recipes;
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    this.preferences = { ...DEFAULT_PREFERENCES, ...(options.initialPreferences ?? {}) };
    this.validatePreferences(this.preferences);
  }

  navigate(route: NavigationRoute): NavigationRoute {
    this.validateRoute(route);
    this.history.push({ ...this.route });
    if (this.history.length > 50) this.history.shift();
    this.route = { ...route };
    this.ledger.append({
      type: "food.navigation",
      actor: this.account?.id ?? "guest",
      subject: route.screen,
      data: { foodId: route.foodId ?? null, recipeId: route.recipeId ?? null },
    });
    return { ...this.route };
  }

  back(): NavigationRoute {
    const previous = this.history.pop();
    if (previous) this.route = previous;
    return { ...this.route };
  }

  signIn(input: { displayName: string; email?: string | null }): UserAccount {
    if (!input.displayName.trim()) throw new Error("an account needs a display name");
    const email = input.email?.trim() || null;
    if (email && !EMAIL.test(email)) throw new Error(`email is not valid: ${email}`);
    const account: UserAccount = {
      id: newId("acc"),
      displayName: input.displayName.trim(),
      email,
      createdAt: nowIso(this.clock),
    };
    this.account = account;
    this.ledger.append({ type: "food.account.signed_in", actor: account.id, subject: account.id, data: {} });
    return { ...account };
  }

  signOut(): void {
    if (!this.account) return;
    const id = this.account.id;
    this.account = null;
    this.ledger.append({ type: "food.account.signed_out", actor: id, subject: id, data: {} });
  }

  updatePreferences(patch: Partial<UserPreferences>): UserPreferences {
    const next = { ...this.preferences, ...patch };
    this.validatePreferences(next);
    this.preferences = next;
    this.ledger.append({
      type: "food.preferences.changed",
      actor: this.account?.id ?? "guest",
      subject: "preferences",
      data: { fields: Object.keys(patch).sort() },
    });
    return { ...next };
  }

  state(): UserState {
    return {
      account: this.account ? { ...this.account } : null,
      route: { ...this.route },
      history: this.history.map((entry) => ({ ...entry })),
      preferences: { ...this.preferences },
    };
  }

  private validateRoute(route: NavigationRoute): void {
    if (!NAVIGATION_SCREENS.includes(route.screen)) throw new Error(`unknown screen: ${route.screen}`);
    if (route.screen === "food") {
      if (!route.foodId) throw new Error("the food screen needs a foodId");
      if (!this.wiki.get(route.foodId)) throw new Error(`no food: ${route.foodId}`);
    }
    if (route.screen === "recipe") {
      if (!route.recipeId) throw new Error("the recipe screen needs a recipeId");
      if (this.recipes && !this.recipes.get(route.recipeId)) throw new Error(`no recipe: ${route.recipeId}`);
    }
    if (route.query !== undefined && typeof route.query !== "string") throw new Error("a search query must be text");
  }

  private validatePreferences(preferences: UserPreferences): void {
    if (!["light", "dark", "system"].includes(preferences.theme)) throw new Error(`unknown theme: ${preferences.theme}`);
    if (!["metric", "imperial"].includes(preferences.units)) throw new Error(`unknown units: ${preferences.units}`);
    if (!LOCALE.test(preferences.locale)) throw new Error(`locale is not a language tag: ${preferences.locale}`);
    for (const key of ["reduceMotion", "highContrast", "warningsOnly", "athenaHandoff"] as const) {
      if (typeof preferences[key] !== "boolean") throw new Error(`${key} must be a boolean`);
    }
  }
}

/* ------------------------------------------------------------- Athena tools */

function requireString(args: Record<string, unknown>, name: string): string {
  const value = args[name];
  if (typeof value !== "string" || !value.trim()) throw new Error(`${name} is required`);
  return value.trim();
}

function stringList(args: Record<string, unknown>, name: string): string[] {
  const value = args[name];
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`${name} must be a list of strings`);
  }
  return value as string[];
}

/**
 * Tools Athena can register directly. They are read-only projections of the
 * wiki, so a model can answer "what is safe", "where do I find it" and "what
 * can I cook" without owning the data.
 */
export function createAthenaFoodTools(
  wiki: FoodWikiService,
  recipes?: RecipeBook,
  atlas?: LocationAtlas,
): ToolDefinition[] {
  const tools: ToolDefinition[] = [
    {
      name: "food.search",
      description: "Search the Food Wiki by name, alias, ingredient or category.",
      parameters: [
        { name: "query", type: "string", required: true },
        { name: "limit", type: "number" },
      ],
      allowedRoles: ["member", "admin"],
      handler: (args) => {
        const limit = args.limit === undefined ? 10 : Number(args.limit);
        if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error("limit is out of range");
        return wiki.search(requireString(args, "query"), limit);
      },
    },
    {
      name: "food.verdict",
      description: "Evaluate a food against declared allergies and medical flags. This warns; it does not diagnose.",
      parameters: [
        { name: "foodId", type: "string", required: true },
        { name: "allergies", type: "object" },
        { name: "medicalFlags", type: "object" },
        { name: "medications", type: "object" },
      ],
      allowedRoles: ["member", "admin"],
      handler: (args) => {
        const foodId = requireString(args, "foodId");
        const food = wiki.get(foodId);
        if (!food) throw new Error(`no food: ${foodId}`);
        const allergies = stringList(args, "allergies").filter((value): value is Allergen =>
          (EU_ALLERGENS as readonly string[]).includes(value),
        );
        const medicalFlags = stringList(args, "medicalFlags").filter((value): value is MedicalFlag =>
          ["pregnancy", "kidney_disease", "diabetes", "hypertension", "gout", "anticoagulant_therapy", "liver_disease"].includes(value),
        );
        const profile: EaterProfile = {
          id: "athena-request",
          allergies,
          medicalFlags,
          medications: stringList(args, "medications"),
        };
        return wiki.evaluate(food, profile);
      },
    },
  ];

  if (atlas) {
    tools.push({
      name: "food.locations",
      description: "Where a food is found: wild, shop, market, garden or online, with an optional season month.",
      parameters: [
        { name: "foodId", type: "string", required: true },
        { name: "month", type: "number" },
      ],
      allowedRoles: ["member", "admin"],
      handler: (args) => {
        const foodId = requireString(args, "foodId");
        if (!wiki.get(foodId)) throw new Error(`no food: ${foodId}`);
        const month = args.month === undefined ? undefined : Number(args.month);
        return atlas.locationsFor(foodId, month);
      },
    });
  }

  if (recipes) {
    tools.push({
      name: "food.recipes",
      description: "Recipes ranked by how many required ingredients are available.",
      parameters: [{ name: "foodIds", type: "object", required: true }],
      allowedRoles: ["member", "admin"],
      handler: (args) => {
        const foodIds = stringList(args, "foodIds");
        if (foodIds.length === 0) throw new Error("foodIds is required");
        return recipes.recipesFor(foodIds);
      },
    });
  }

  return tools;
}
