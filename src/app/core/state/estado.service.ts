import { Injectable, computed, effect, signal } from '@angular/core';
import { Pedido } from '../models/pedido.model';
import { DispatchPrep, ProcessedEntry } from '../models/despacho.model';

const K_PREPARED = 'forli_prepared_items';
const K_CART = 'forli_cart';
const K_PROCESSED = 'forli_processed';
const K_DISPATCH_PREFIX = 'forli_dispatch_prep_';

@Injectable({ providedIn: 'root' })
export class EstadoService {
  readonly preparedItems = signal<Pedido[]>([]);
  readonly cart = signal<Pedido[]>([]);
  readonly processed = signal<ProcessedEntry[]>([]);
  readonly dispatchPrepared = signal<Record<string, DispatchPrep>>({});

  readonly chofer = signal('');
  readonly placa = signal('');

  readonly preparedPeds = computed(() => new Set(this.preparedItems().map((i) => i.pedido)));
  readonly preparedCount = computed(() => this.preparedPeds().size);
  readonly cartPedidoCount = computed(() => new Set(this.cart().map((i) => i.pedido)).size);

  readonly totalEspuma = computed(() =>
    this.cart()
      .filter((i) => i.linea.includes('ESPUMA') && i.producto.toUpperCase().includes('COLCHON'))
      .reduce((acc, curr) => acc + (curr.cantidad || 0), 0),
  );
  readonly totalResorte = computed(() =>
    this.cart().filter((i) => i.linea.includes('RESORTE')).reduce((acc, curr) => acc + (curr.cantidad || 0), 0),
  );

  private readonly persistence = effect(() => {
    try {
      sessionStorage.setItem(K_PREPARED, JSON.stringify(this.preparedItems()));
    } catch {
      /* ignore */
    }
  });

  private readonly cartPersistence = effect(() => {
    try {
      sessionStorage.setItem(K_CART, JSON.stringify(this.cart()));
    } catch {
      /* ignore */
    }
  });

  private readonly processedPersistence = effect(() => {
    try {
      sessionStorage.setItem(K_PROCESSED, JSON.stringify(this.processed()));
    } catch {
      /* ignore */
    }
  });

  constructor() {
    this.loadFromSession();
  }

  private loadFromSession(): void {
    const read = (k: string): unknown => {
      try {
        const raw = sessionStorage.getItem(k);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    const prepared = read(K_PREPARED);
    this.preparedItems.set(Array.isArray(prepared) ? (prepared as Pedido[]) : []);

    const cart = read(K_CART);
    this.cart.set(Array.isArray(cart) ? (cart as Pedido[]) : []);

    const processed = read(K_PROCESSED);
    this.processed.set(Array.isArray(processed) ? (processed as ProcessedEntry[]) : []);

    const dispatch: Record<string, DispatchPrep> = {};
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(K_DISPATCH_PREFIX))
        .forEach((k) => {
          try {
            const v = JSON.parse(sessionStorage.getItem(k) ?? 'null');
            if (v && v.total !== undefined) dispatch[k.replace(K_DISPATCH_PREFIX, '')] = v as DispatchPrep;
          } catch {
            /* ignore */
          }
        });
    } catch {
      /* ignore */
    }
    this.dispatchPrepared.set(dispatch);
  }

  isPrepared(pedido: string): boolean {
    return this.preparedPeds().has(pedido);
  }

  togglePrepare(pedido: string, items: Pedido[]): boolean {
    const was = this.isPrepared(pedido);
    if (was) {
      this.preparedItems.update((list) => list.filter((i) => i.pedido !== pedido));
    } else {
      const existing = new Set(this.preparedItems().map((i) => i.pedido));
      if (!existing.has(pedido)) {
        this.preparedItems.update((list) => [...list, ...items]);
      }
    }
    return !was;
  }

  addToCart(items: Pedido[]): void {
    const existing = new Set(this.cart().map((i) => i.idUnico));
    const nuevos = items.filter((i) => !existing.has(i.idUnico));
    if (nuevos.length) this.cart.update((list) => [...list, ...nuevos]);
  }

  removeFromCart(idUnico: number): void {
    this.cart.update((list) => list.filter((i) => i.idUnico !== idUnico));
  }

  isInCart(pedido: string): boolean {
    return this.cart().some((i) => i.pedido === pedido);
  }

  isProcessed(pedido: string): boolean {
    return this.processed().some((p) => p.pedido === pedido);
  }

  setCartOrder(items: Pedido[]): void {
    this.cart.set(items);
  }

  resetSession(): void {
    this.cart.set([]);
    this.processed.set([]);
    this.preparedItems.set([]);
    this.chofer.set('');
    this.placa.set('');
    try {
      sessionStorage.removeItem(K_CART);
      sessionStorage.removeItem(K_PROCESSED);
      sessionStorage.removeItem(K_PREPARED);
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(K_DISPATCH_PREFIX))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    this.dispatchPrepared.set({});
  }

  markDispatched(items: Pedido[]): DispatchPrep {
    const seen = new Set<string>();
    items.forEach((i) => seen.add(i.pedido));

    const preSnapshot = new Set(this.preparedItems().map((i) => i.pedido));
    const preparedPeds: string[] = [];
    const notPreparedPeds: string[] = [];
    seen.forEach((ped) => (preSnapshot.has(ped) ? preparedPeds.push(ped) : notPreparedPeds.push(ped)));

    const entries = new Map<string, string>();
    items.forEach((i) => {
      if (!entries.has(i.pedido)) entries.set(i.pedido, i.ubigeo);
    });
    const nuevosProcesados: ProcessedEntry[] = [];
    entries.forEach((ubigeo, pedido) => nuevosProcesados.push({ pedido, ubigeo }));
    this.processed.update((list) => [...list, ...nuevosProcesados]);

    this.preparedItems.update((list) => list.filter((i) => !seen.has(i.pedido)));
    this.cart.set([]);

    return { total: seen.size, prepared: preparedPeds.length, preparedPeds, notPreparedPeds };
  }

  recordDispatchPrepared(id: string, data: DispatchPrep): void {
    this.dispatchPrepared.update((m) => ({ ...m, [id]: data }));
    try {
      sessionStorage.setItem(K_DISPATCH_PREFIX + id, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }

  removeDispatchPrepared(id: string): void {
    this.dispatchPrepared.update((m) => {
      const next = { ...m };
      delete next[id];
      return next;
    });
    try {
      sessionStorage.removeItem(K_DISPATCH_PREFIX + id);
    } catch {
      /* ignore */
    }
  }

  loadToCart(items: Pedido[]): void {
    this.addToCart(items);
  }

  /** Persiste el orden del carrito tras reordenar. */
  persistCart(): void {
    try {
      sessionStorage.setItem(K_CART, JSON.stringify(this.cart()));
    } catch {
      /* ignore */
    }
  }
}
