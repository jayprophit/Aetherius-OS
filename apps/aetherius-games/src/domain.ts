import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface GameLibraryEntry {
  id: string;
  title: string;
  genre: string;
  installed: boolean;
}

export interface GamesOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class GamesService {
  private readonly library = new Map<string, GameLibraryEntry>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: GamesOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  add(entry: Omit<GameLibraryEntry, "id">): GameLibraryEntry {
    const game: GameLibraryEntry = { ...entry, id: newId("game") };
    this.library.set(game.id, game);
    this.ledger.append({ type: "games.added", actor: "games", subject: game.id });
    return game;
  }

  list(): GameLibraryEntry[] {
    return Array.from(this.library.values());
  }
}
