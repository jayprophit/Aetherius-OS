/**
 * Money is an integer number of minor units plus an ISO-4217 currency code.
 * Floating point is never used for an amount: 0.1 + 0.2 is not money.
 */
export interface Money {
  /** Integer minor units, e.g. cents. May be negative (a credit). */
  amount: number;
  /** Upper-case ISO-4217 code. */
  currency: string;
}

const CURRENCY = /^[A-Z]{3}$/;

export function money(amount: number, currency = "USD"): Money {
  if (!Number.isSafeInteger(amount)) {
    throw new Error(`money amount must be an integer number of minor units: ${amount}`);
  }
  const code = currency.toUpperCase();
  if (!CURRENCY.test(code)) throw new Error(`invalid currency: ${currency}`);
  // Normalise negative zero so a settled balance compares equal to zero.
  return { amount: amount === 0 ? 0 : amount, currency: code };
}

export function assertMoney(value: Money): void {
  if (!Number.isSafeInteger(value.amount)) {
    throw new Error(`money amount is not an integer: ${value.amount}`);
  }
  if (!CURRENCY.test(value.currency)) {
    throw new Error(`invalid currency: ${value.currency}`);
  }
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amount + b.amount, a.currency);
}

export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amount - b.amount, a.currency);
}

export function multiplyMoney(value: Money, factor: number): Money {
  if (!Number.isFinite(factor) || factor < 0) {
    throw new Error(`invalid money factor: ${factor}`);
  }
  return money(Math.round(value.amount * factor), value.currency);
}

export function sumMoney(values: readonly Money[], currency = "USD"): Money {
  return values.reduce((total, value) => addMoney(total, value), money(0, currency));
}

export function assertSameCurrency(a: Money, b: Money): void {
  assertMoney(a);
  assertMoney(b);
  if (a.currency !== b.currency) {
    throw new Error(`currency mismatch: ${a.currency} and ${b.currency}`);
  }
}

/** "12.34" USD -> 1234. The parse is strict, so a typo cannot become money. */
export function parseMoney(text: string, currency = "USD"): Money {
  const match = /^(-)?(\d+)(?:\.(\d{1,2}))?$/.exec(text.trim());
  if (!match) throw new Error(`invalid money: ${text}`);
  const sign = match[1] === "-" ? -1 : 1;
  const whole = Number(match[2]);
  const fraction = Number((match[3] ?? "").padEnd(2, "0"));
  if (!Number.isSafeInteger(whole)) throw new Error(`money is too large: ${text}`);
  return money(sign * (whole * 100 + fraction), currency);
}

export function formatMoney(value: Money): string {
  assertMoney(value);
  const sign = value.amount < 0 ? "-" : "";
  const absolute = Math.abs(value.amount);
  return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")} ${value.currency}`;
}
