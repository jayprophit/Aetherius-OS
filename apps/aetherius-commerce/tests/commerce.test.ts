import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AccountService,
  EntitlementService,
  EventLedger,
  MemoryRepository,
  NotificationService,
  money,
  parseMoney,
} from "../../app-kit/src/index.ts";
import { CommerceService, LocalTestPaymentProvider, type PaymentProvider } from "../src/commerce.ts";

function setup(payments?: PaymentProvider) {
  const ledger = new EventLedger();
  const accounts = new AccountService(new MemoryRepository(), new MemoryRepository(), { ledger });
  const merchant = accounts.create({ handle: "merchant", displayName: "Merchant", roles: ["merchant"] });
  const customer = accounts.create({ handle: "customer", displayName: "Customer" });
  const admin = accounts.create({ handle: "admin", displayName: "Admin", roles: ["admin"] });
  const entitlements = new EntitlementService(new MemoryRepository(), { ledger });
  const notifications = new NotificationService(new MemoryRepository());
  const commerce = new CommerceService(new MemoryRepository(), new MemoryRepository(), new MemoryRepository(), {
    ledger,
    entitlements,
    notifications,
    payments,
  });
  const product = commerce.createProduct(merchant, {
    sku: "LOAF-001",
    name: "Sourdough loaf",
    price: parseMoney("12.50"),
    inventory: 10,
    tags: ["bakery"],
  });
  commerce.publishProduct(merchant, product.id);
  return { ledger, merchant, customer, admin, entitlements, notifications, commerce, product };
}

test("a customer checks out and receives an entitlement", () => {
  const { customer, entitlements, notifications, commerce, product } = setup();
  commerce.addToCart(customer, product.id, 2);
  const order = commerce.checkout(customer, "key-1");

  assert.equal(order.status, "paid");
  assert.equal(order.total.amount, 2500);
  assert.equal(order.paymentProvider, "local-test");
  assert.equal(commerce.catalogue().find((item) => item.id === product.id)?.inventory, 8);
  assert.equal(entitlements.has(customer.id, "commerce:product:LOAF-001"), true);
  assert.equal(notifications.unreadCount(customer.id), 1);
  assert.equal(commerce.cart(customer.id).lines.length, 0);
});

test("checkout is idempotent and does not decrement stock twice", () => {
  const { customer, commerce, product } = setup();
  commerce.addToCart(customer, product.id, 1);
  const first = commerce.checkout(customer, "same-key");
  const second = commerce.checkout(customer, "same-key");
  assert.equal(second.id, first.id);
  assert.equal(commerce.catalogue().find((item) => item.id === product.id)?.inventory, 9);
  assert.equal(commerce.ordersFor(customer.id).length, 1);
});

test("an oversell is refused before payment and leaves stock alone", () => {
  const { customer, commerce, product } = setup();
  commerce.addToCart(customer, product.id, 99);
  assert.throws(() => commerce.checkout(customer, "too-many"), /insufficient inventory/);
  assert.equal(commerce.catalogue().find((item) => item.id === product.id)?.inventory, 10);
});

test("a declined payment leaves stock and entitlement untouched", () => {
  const { customer, entitlements, commerce, product } = setup(new LocalTestPaymentProvider(100));
  commerce.addToCart(customer, product.id, 1);
  assert.throws(() => commerce.checkout(customer, "declined"), /payment declined/);
  assert.equal(commerce.catalogue().find((item) => item.id === product.id)?.inventory, 10);
  assert.equal(entitlements.has(customer.id, "commerce:product:LOAF-001"), false);
});

test("only a merchant may list a product", () => {
  const { customer, commerce } = setup();
  assert.throws(
    () =>
      commerce.createProduct(customer, {
        sku: "NOPE-1",
        name: "Not allowed",
        price: money(100),
      }),
    /requires one of/,
  );
});

test("fulfilment notifies the customer and a refund restores stock and revokes access", () => {
  const { customer, admin, merchant, entitlements, commerce, product } = setup();
  commerce.addToCart(customer, product.id, 3);
  const order = commerce.checkout(customer, "refund-me");
  const fulfilled = commerce.fulfil(merchant, order.id);
  assert.equal(fulfilled.status, "fulfilled");
  assert.equal(commerce.salesReport(merchant).units, 3);

  const refunded = commerce.refund(admin, order.id, "customer changed their mind");
  assert.equal(refunded.status, "refunded");
  assert.equal(commerce.catalogue().find((item) => item.id === product.id)?.inventory, 10);
  assert.equal(entitlements.has(customer.id, "commerce:product:LOAF-001"), false);
  assert.throws(() => commerce.refund(admin, order.id, "again"), /cannot be refunded/);
});
