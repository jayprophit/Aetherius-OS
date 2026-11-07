import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CommerceOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Commerce {
  private readonly products = new Map<string, Product>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: CommerceOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addProduct(name: string, price: number, stock: number): Product {
    const product: Product = { id: newId("product"), name, price, stock };
    this.products.set(product.id, product);
    this.ledger.append({ type: "commerce.added", actor: "commerce", subject: product.id });
    return product;
  }

  listProducts(): Product[] {
    return Array.from(this.products.values());
  }
}
