import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Order {
  id: string;
  product: string;
  quantity: number;
  total: number;
}

export interface BusinessOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Business {
  private readonly orders = new Map<string, Order>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: BusinessOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  placeOrder(product: string, quantity: number, total: number): Order {
    const order: Order = { id: newId("order"), product, quantity, total };
    this.orders.set(order.id, order);
    this.ledger.append({ type: "business.ordered", actor: "business", subject: order.id });
    return order;
  }

  listOrders(): Order[] {
    return Array.from(this.orders.values());
  }
}
