import { test } from "node:test";
import assert from "node:assert/strict";

import { EventLedger } from "../src/ledger.ts";
import { formatMoney, money, multiplyMoney, parseMoney, sumMoney } from "../src/money.ts";
import { SearchIndex } from "../src/search.ts";

test("ledger is append-only and detects an altered event", () => {
  const ledger = new EventLedger();
  ledger.append({ type: "a", actor: "one", subject: "thing", data: { n: 1 } });
  ledger.append({ type: "b", actor: "one", subject: "thing", data: { n: 2 } });
  assert.equal(ledger.length, 2);
  assert.equal(EventLedger.verify(ledger.all()).ok, true);

  const tampered = ledger.all();
  tampered[0]!.data.n = 99;
  const result = EventLedger.verify(tampered);
  assert.equal(result.ok, false);
});

test("money is integer minor units and refuses a float", () => {
  assert.deepEqual(parseMoney("12.34"), { amount: 1234, currency: "USD" });
  assert.equal(formatMoney(money(1234)), "12.34 USD");
  assert.equal(sumMoney([money(100), money(250)]).amount, 350);
  assert.equal(multiplyMoney(money(199), 3).amount, 597);
  assert.throws(() => money(1.5), /integer/);
  assert.throws(() => parseMoney("1.234"), /invalid money/);
});

test("search ranks a title match above a body match and requires every token", () => {
  const index = new SearchIndex();
  index.add({ id: "a", title: "Sourdough bread", body: "flour water salt", tags: ["baking"] });
  index.add({ id: "b", title: "Bread knife", body: "sourdough is mentioned here", tags: [] });
  index.add({ id: "c", title: "Unrelated", body: "nothing", tags: [] });

  const hits = index.search("sourdough");
  assert.deepEqual(hits.map((hit) => hit.id), ["a", "b"]);
  assert.deepEqual(index.search("sourdough salt").map((hit) => hit.id), ["a"]);
  assert.deepEqual(index.search("missing"), []);
});
