import {
  EventLedger,
  EntitlementService,
  NotificationService,
  money,
  multiplyMoney,
  sumMoney,
  type Account,
  type Money,
  type Repository,
} from "../../app-kit/src/index.ts";
import { newId, nowIso } from "../../app-kit/src/ids.ts";

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: Money;
  inventory: number;
  status: "draft" | "active" | "archived";
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface Cart {
  id: string;
  accountId: string;
  lines: CartLine[];
  updatedAt: string;
}

export interface OrderLine {
  productId: string;
  sku: string;
  name: string;
  unitPrice: Money;
  quantity: number;
  lineTotal: Money;
}

export type OrderStatus = "paid" | "fulfilled" | "cancelled" | "refunded";

export interface Order {
  id: string;
  number: string;
  accountId: string;
  lines: OrderLine[];
  subtotal: Money;
  total: Money;
  status: OrderStatus;
  paymentProvider: string;
  paymentReference: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequest {
  amount: Money;
  reference: string;
  accountId: string;
}

export interface PaymentResult {
  authorized: boolean;
  reference: string;
  reason?: string;
}

export interface PaymentProvider {
  readonly name: string;
  authorize(request: PaymentRequest): PaymentResult;
}

/**
 * A deterministic local provider for tests and demonstrations. It is NOT a
 * payment processor and must never be configured against real money. The
 * owner's rule is explicit: no real financial transaction without approval.
 */
export class LocalTestPaymentProvider implements PaymentProvider {
  readonly name = "local-test";
  private readonly ceiling: number;

  constructor(ceilingMinorUnits = 100_000) {
    this.ceiling = ceilingMinorUnits;
  }

  authorize(request: PaymentRequest): PaymentResult {
    if (request.amount.currency !== "USD") {
      return { authorized: false, reference: "", reason: `unsupported currency ${request.amount.currency}` };
    }
    if (request.amount.amount > this.ceiling) {
      return { authorized: false, reference: "", reason: "amount exceeds the local test ceiling" };
    }
    return { authorized: true, reference: `test_${request.reference}` };
  }
}

function requireRole(account: Account, roles: readonly string[]): void {
  if (account.status !== "active") throw new Error("account is not active");
  if (!roles.some((role) => account.roles.includes(role))) {
    throw new Error(`this action requires one of: ${roles.join(", ")}`);
  }
}

export interface CommerceOptions {
  ledger?: EventLedger;
  entitlements?: EntitlementService;
  notifications?: NotificationService;
  payments?: PaymentProvider;
  clock?: () => Date;
}

/**
 * Commerce: catalogue, cart, checkout and fulfilment.
 *
 * Inventory is decremented only inside a successful checkout, and a declined
 * payment restores it. Each order grants an entitlement, so a purchase and a
 * course enrolment use the same access mechanism.
 */
export class CommerceService {
  private readonly products: Repository<Product>;
  private readonly carts: Repository<Cart>;
  private readonly orders: Repository<Order>;
  private readonly options: CommerceOptions;
  private readonly payments: PaymentProvider;
  private readonly clock: () => Date;

  constructor(
    products: Repository<Product>,
    carts: Repository<Cart>,
    orders: Repository<Order>,
    options: CommerceOptions = {},
  ) {
    this.products = products;
    this.carts = carts;
    this.orders = orders;
    this.options = options;
    this.payments = options.payments ?? new LocalTestPaymentProvider();
    this.clock = options.clock ?? (() => new Date());
  }

  createProduct(actor: Account, input: {
    sku: string;
    name: string;
    description?: string;
    price: Money;
    inventory?: number;
    tags?: string[];
  }): Product {
    requireRole(actor, ["merchant", "admin"]);
    const sku = input.sku.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{1,31}$/.test(sku)) throw new Error(`invalid sku: ${input.sku}`);
    if (this.products.all().some((product) => product.sku === sku)) throw new Error(`sku already exists: ${sku}`);
    if (!input.name.trim()) throw new Error("product needs a name");
    const inventory = input.inventory ?? 0;
    if (!Number.isSafeInteger(inventory) || inventory < 0) throw new Error("inventory must be a non-negative integer");
    if (input.price.amount < 0) throw new Error("price cannot be negative");
    const at = nowIso(this.clock);
    const product: Product = {
      id: newId("prd"),
      sku,
      name: input.name.trim(),
      description: input.description ?? "",
      price: input.price,
      inventory,
      status: "draft",
      tags: [...new Set((input.tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean))],
      createdAt: at,
      updatedAt: at,
    };
    this.products.put(product);
    this.record("commerce.product_created", actor.id, product.id, { sku });
    return structuredClone(product);
  }

  publishProduct(actor: Account, productId: string): Product {
    requireRole(actor, ["merchant", "admin"]);
    const product = this.requireProduct(productId);
    if (product.price.amount <= 0) throw new Error("a free product must use an entitlement grant, not a paid listing");
    product.status = "active";
    product.updatedAt = nowIso(this.clock);
    this.products.put(product);
    this.record("commerce.product_published", actor.id, product.id, { sku: product.sku });
    return structuredClone(product);
  }

  archiveProduct(actor: Account, productId: string): Product {
    requireRole(actor, ["merchant", "admin"]);
    const product = this.requireProduct(productId);
    product.status = "archived";
    product.updatedAt = nowIso(this.clock);
    this.products.put(product);
    this.record("commerce.product_archived", actor.id, product.id, { sku: product.sku });
    return structuredClone(product);
  }

  setInventory(actor: Account, productId: string, inventory: number): Product {
    requireRole(actor, ["merchant", "admin"]);
    if (!Number.isSafeInteger(inventory) || inventory < 0) throw new Error("inventory must be a non-negative integer");
    const product = this.requireProduct(productId);
    product.inventory = inventory;
    product.updatedAt = nowIso(this.clock);
    this.products.put(product);
    this.record("commerce.inventory_set", actor.id, product.id, { inventory });
    return structuredClone(product);
  }

  catalogue(filter: { includeDrafts?: boolean; tag?: string } = {}): Product[] {
    return this.products
      .all()
      .filter((product) => filter.includeDrafts === true || product.status === "active")
      .filter((product) => filter.tag === undefined || product.tags.includes(filter.tag))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((product) => structuredClone(product));
  }

  cart(accountId: string): Cart {
    const existing = this.carts.all().find((cart) => cart.accountId === accountId);
    if (existing) return structuredClone(existing);
    const cart: Cart = { id: newId("crt"), accountId, lines: [], updatedAt: nowIso(this.clock) };
    this.carts.put(cart);
    return structuredClone(cart);
  }

  addToCart(actor: Account, productId: string, quantity = 1): Cart {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new Error("quantity must be a positive integer");
    const product = this.requireProduct(productId);
    if (product.status !== "active") throw new Error("only an active product can be added to a cart");
    const cart = this.cart(actor.id);
    const line = cart.lines.find((candidate) => candidate.productId === productId);
    if (line) line.quantity += quantity;
    else cart.lines.push({ productId, quantity });
    cart.updatedAt = nowIso(this.clock);
    this.carts.put(cart);
    this.record("commerce.cart_updated", actor.id, cart.id, { productId, quantity });
    return structuredClone(cart);
  }

  removeFromCart(actor: Account, productId: string): Cart {
    const cart = this.cart(actor.id);
    cart.lines = cart.lines.filter((line) => line.productId !== productId);
    cart.updatedAt = nowIso(this.clock);
    this.carts.put(cart);
    return structuredClone(cart);
  }

  quote(actor: Account): { lines: OrderLine[]; subtotal: Money; total: Money } {
    const cart = this.cart(actor.id);
    if (cart.lines.length === 0) throw new Error("the cart is empty");
    const lines = cart.lines.map((line) => {
      const product = this.requireProduct(line.productId);
      const lineTotal = multiplyMoney(product.price, line.quantity);
      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        unitPrice: product.price,
        quantity: line.quantity,
        lineTotal,
      };
    });
    const subtotal = sumMoney(lines.map((line) => line.lineTotal), lines[0]!.unitPrice.currency);
    return { lines, subtotal, total: subtotal };
  }

  checkout(actor: Account, idempotencyKey: string): Order {
    if (!idempotencyKey.trim()) throw new Error("checkout needs an idempotency key");
    const previous = this.orders
      .all()
      .find((order) => order.accountId === actor.id && order.idempotencyKey === idempotencyKey);
    if (previous) return structuredClone(previous);

    const quote = this.quote(actor);
    const products = quote.lines.map((line) => this.requireProduct(line.productId));
    for (let index = 0; index < quote.lines.length; index += 1) {
      const line = quote.lines[index]!;
      const product = products[index]!;
      if (product.status !== "active") throw new Error(`product is no longer available: ${product.sku}`);
      if (product.inventory < line.quantity) {
        throw new Error(`insufficient inventory for ${product.sku}: wanted ${line.quantity}, have ${product.inventory}`);
      }
    }

    const orderId = newId("ord");
    const payment = this.payments.authorize({
      amount: quote.total,
      reference: orderId,
      accountId: actor.id,
    });

    if (!payment.authorized) {
      this.record("commerce.payment_declined", actor.id, orderId, {
        reason: payment.reason ?? "declined",
        total: quote.total.amount,
      });
      throw new Error(`payment declined: ${payment.reason ?? "declined"}`);
    }

    // Inventory moves only after authorization. A local provider is synchronous
    // by design, so there is no window in which a payment succeeded and the
    // reservation did not happen.
    for (let index = 0; index < products.length; index += 1) {
      const product = products[index]!;
      const line = quote.lines[index]!;
      product.inventory -= line.quantity;
      product.updatedAt = nowIso(this.clock);
      this.products.put(product);
    }

    const at = nowIso(this.clock);
    const order: Order = {
      id: orderId,
      number: `AOS-${String(this.orders.all().length + 1).padStart(6, "0")}`,
      accountId: actor.id,
      lines: quote.lines,
      subtotal: quote.subtotal,
      total: quote.total,
      status: "paid",
      paymentProvider: this.payments.name,
      paymentReference: payment.reference,
      idempotencyKey,
      createdAt: at,
      updatedAt: at,
    };
    this.orders.put(order);

    for (const line of order.lines) {
      this.options.entitlements?.grant({
        accountId: actor.id,
        entitlement: `commerce:product:${line.sku}`,
        source: `order:${order.id}`,
      });
    }
    this.options.notifications?.notify(actor.id, "Order confirmed", `${order.number} is paid.`, {
      kind: "commerce",
      data: { orderId: order.id },
    });
    const cart = this.cart(actor.id);
    cart.lines = [];
    cart.updatedAt = at;
    this.carts.put(cart);
    this.record("commerce.order_paid", actor.id, order.id, {
      number: order.number,
      total: order.total.amount,
      currency: order.total.currency,
      provider: order.paymentProvider,
    });
    return structuredClone(order);
  }

  fulfil(actor: Account, orderId: string): Order {
    requireRole(actor, ["merchant", "admin"]);
    const order = this.requireOrder(orderId);
    if (order.status !== "paid") throw new Error(`only a paid order can be fulfilled, not ${order.status}`);
    order.status = "fulfilled";
    order.updatedAt = nowIso(this.clock);
    this.orders.put(order);
    this.options.notifications?.notify(order.accountId, "Order fulfilled", `${order.number} has been fulfilled.`, {
      kind: "commerce",
      data: { orderId: order.id },
    });
    this.record("commerce.order_fulfilled", actor.id, order.id, { number: order.number });
    return structuredClone(order);
  }

  refund(actor: Account, orderId: string, reason: string): Order {
    requireRole(actor, ["admin"]);
    if (!reason.trim()) throw new Error("a refund needs a reason");
    const order = this.requireOrder(orderId);
    if (order.status !== "paid" && order.status !== "fulfilled") {
      throw new Error(`order ${order.number} cannot be refunded from ${order.status}`);
    }
    for (const line of order.lines) {
      const product = this.products.get(line.productId);
      if (!product) continue;
      product.inventory += line.quantity;
      product.updatedAt = nowIso(this.clock);
      this.products.put(product);
    }
    const grants = this.options.entitlements?.forAccount(order.accountId) ?? [];
    for (const grant of grants) {
      if (grant.source === `order:${order.id}` && grant.revokedAt === null) {
        this.options.entitlements?.revoke(grant.id, actor.id, `refund ${order.number}: ${reason}`);
      }
    }
    order.status = "refunded";
    order.updatedAt = nowIso(this.clock);
    this.orders.put(order);
    this.record("commerce.order_refunded", actor.id, order.id, { number: order.number, reason });
    return structuredClone(order);
  }

  ordersFor(accountId: string): Order[] {
    return this.orders
      .all()
      .filter((order) => order.accountId === accountId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((order) => structuredClone(order));
  }

  allOrders(actor: Account): Order[] {
    requireRole(actor, ["merchant", "admin"]);
    return this.orders
      .all()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((order) => structuredClone(order));
  }

  salesReport(actor: Account): { orders: number; revenue: Money; units: number } {
    requireRole(actor, ["merchant", "admin"]);
    const counted = this.orders.all().filter((order) => order.status === "paid" || order.status === "fulfilled");
    const revenue = counted.reduce((total, order) => total + order.total.amount, 0);
    const units = counted.reduce(
      (total, order) => total + order.lines.reduce((count, line) => count + line.quantity, 0),
      0,
    );
    return { orders: counted.length, revenue: money(revenue, counted[0]?.total.currency ?? "USD"), units };
  }

  private requireProduct(id: string): Product {
    const product = this.products.get(id);
    if (!product) throw new Error(`no product: ${id}`);
    return structuredClone(product);
  }

  private requireOrder(id: string): Order {
    const order = this.orders.get(id);
    if (!order) throw new Error(`no order: ${id}`);
    return structuredClone(order);
  }

  private record(type: string, actor: string, subject: string, data: Record<string, unknown>): void {
    this.options.ledger?.append({ type, actor, subject, data });
  }
}
