import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Translation {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

export interface LanguageOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class LanguageService {
  private readonly translations: Translation[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: LanguageOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  translate(sourceText: string, sourceLang: string, targetLang: string): Translation {
    const translation: Translation = {
      id: newId("trans"),
      sourceText,
      translatedText: `[${targetLang}] ${sourceText}`,
      sourceLang,
      targetLang,
    };
    this.translations.push(translation);
    this.ledger.append({ type: "language.translated", actor: "language", subject: translation.id });
    return translation;
  }
}
