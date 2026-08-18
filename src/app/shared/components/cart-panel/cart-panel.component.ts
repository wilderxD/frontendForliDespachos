import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import Sortable from 'sortablejs';
import { LucideCircleX, LucideGripVertical, LucideInbox, LucideLoaderCircle, LucidePrinter, LucideRotateCcw, LucideShoppingCart, LucideStore, LucideUser } from '@lucide/angular';
import { Pedido } from '../../../core/models/pedido.model';
import { GuardarResult } from '../../../core/models/despacho.model';
import { AgenciaGroup, ClienteGroup } from '../../utils/pedido-utils';
import { EstadoService } from '../../../core/state/estado.service';
import { ResourcesService } from '../../../core/resources/resources.service';
import { ApiService } from '../../../core/api/api.service';
import { PrintService } from '../../../core/services/print.service';
import { ModalService } from '../../ui/modal.service';
import { ToastService } from '../../ui/toast.service';

interface CartPedido {
  pedido: string;
  items: Pedido[];
}

@Component({
  selector: 'app-cart-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LucideCircleX,
    LucideGripVertical,
    LucideInbox,
    LucideLoaderCircle,
    LucidePrinter,
    LucideRotateCcw,
    LucideShoppingCart,
    LucideStore,
    LucideUser,
  ],
  template: `
    <div class="flex h-full min-h-0 flex-col">
      <div class="flex items-center justify-between gap-2 bg-indigo-600 px-3 py-2 text-white">
        <div class="flex min-w-0 items-center gap-1.5">
          <svg lucideShoppingCart [size]="16" [strokeWidth]="2" aria-hidden="true" class="shrink-0"></svg>
          <span class="text-sm font-semibold">Preparación</span>
          <span class="badge badge-espuma" role="status" aria-live="polite">E:{{ totalEspuma() }}</span>
          <span class="badge badge-resorte" role="status" aria-live="polite">R:{{ totalResorte() }}</span>
        </div>
        <button
          type="button"
          class="btn btn-ghost min-h-8 px-2 py-0 text-xs font-bold text-white hover:bg-white/10 dark:hover:bg-white/10"
          (click)="reiniciar()"
          title="Borrar todo y empezar jornada nueva"
        >
          <svg lucideRotateCcw [size]="14" [strokeWidth]="2" aria-hidden="true"></svg> Reiniciar
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-800 dark:bg-slate-800">
        <div>
          <label class="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300" for="selChofer">Chofer</label>
          <select id="selChofer" class="select" (change)="chofer.set($any($event.target).value)">
            <option value="">-- Seleccionar --</option>
            @for (c of choferes(); track c) {
              <option [value]="c" [selected]="chofer() === c">{{ c }}</option>
            }
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300" for="selPlaca">Placa</label>
          <select id="selPlaca" class="select" (change)="placa.set($any($event.target).value)">
            <option value="">-- Seleccionar --</option>
            @for (p of placas(); track p) {
              <option [value]="p" [selected]="placa() === p">{{ p }}</option>
            }
          </select>
        </div>
      </div>

      <div class="border-b border-slate-200 bg-slate-100 px-3 pb-2 pt-1 dark:border-slate-800 dark:bg-slate-800">
        <div class="mb-1 flex items-center justify-between">
          <small class="font-semibold text-slate-600 dark:text-slate-300">{{ cartPedidoCount() }} / {{ total() }} pedidos</small>
          <small class="font-bold text-indigo-600 dark:text-indigo-400" style="font-size:0.75rem">{{ pct() }}%</small>
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            class="h-full rounded-full transition-all"
            role="progressbar"
            [style.width.%]="pct()"
            [attr.aria-valuenow]="pct()"
            aria-valuemin="0"
            aria-valuemax="100"
            style="background:linear-gradient(90deg,#4f46e5,#f59e0b)"
          ></div>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-2" #cartList id="cartList">
        @if (cart().length === 0) {
          <div class="mt-5 text-center text-sm text-slate-500" role="status">
            <svg lucideInbox [size]="32" [strokeWidth]="1.5" aria-hidden="true" class="mx-auto mb-2 opacity-40"></svg>
            Selecciona pedidos del panel izquierdo
          </div>
        } @else {
          @for (ag of cartAgencias(); track ag.agencia) {
            <div class="cart-agencia overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-700">
              <button
                type="button"
                class="cart-agencia-header flex min-h-9 w-full items-center gap-1.5 bg-slate-200 px-2 py-1 text-left text-xs font-bold uppercase tracking-wide text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                (click)="toggleCartAgencia(ag.agencia)"
                [attr.aria-expanded]="isCartAgenciaOpen(ag.agencia)"
                [attr.data-agencia]="ag.agencia"
              >
                <svg lucideGripVertical [size]="14" [strokeWidth]="2" aria-hidden="true" class="drag-handle shrink-0 text-slate-500"></svg>
                <svg lucideStore [size]="13" [strokeWidth]="2" aria-hidden="true" class="shrink-0"></svg>
                <span class="truncate">{{ ag.agencia }}</span>
                <small class="ml-auto whitespace-nowrap text-xs font-semibold text-slate-500 dark:text-slate-400">{{ ag.total }} ped.</small>
              </button>
              @if (isCartAgenciaOpen(ag.agencia)) {
                <div class="cart-agencia-body p-1">
                  @for (cli of ag.clientes; track cli.cliente; let idx = $index) {
                    <div class="mb-1 overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-700" style="animation-delay:{{ idx * 0.04 }}s">
                      <div
                        class="cart-client-header flex min-h-11 cursor-pointer items-center justify-between gap-2 border-l-4 border-indigo-500 bg-slate-100 px-2 py-1 dark:bg-slate-800"
                        (click)="toggleCartCliente(cli.cliente)"
                        role="button"
                        tabindex="0"
                        [attr.data-cliente]="cli.cliente"
                        [attr.aria-expanded]="isCartClienteOpen(cli.cliente)"
                      >
                        <small class="flex min-w-0 items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                          <svg lucideGripVertical [size]="14" [strokeWidth]="2" aria-hidden="true" class="drag-handle shrink-0 text-slate-400"></svg>
                          <svg lucideUser [size]="14" [strokeWidth]="2" aria-hidden="true" class="shrink-0"></svg>
                          <span class="truncate">{{ cli.cliente }}</span>
                        </small>
                        <small class="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">{{ cli.pedidos.length }} ped.</small>
                      </div>
                      @if (isCartClienteOpen(cli.cliente)) {
                        <div>
                          @for (pi of cli.pedidos; track pi.pedido) {
                            <div class="border-start border-b border-l-4 border-emerald-500 bg-white px-2 py-1 last:border-b-0 dark:bg-slate-900">
                              <div class="fw-bold small">
                                <span class="font-mono text-sm font-bold text-slate-800 dark:text-slate-100">{{ pi.pedido }}</span>
                              </div>
                              @for (i of pi.items; track i.idUnico) {
                                <div class="mt-1 flex items-center justify-between gap-2 overflow-hidden border-t border-slate-200 pt-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
                                  <div class="flex min-w-0 items-center gap-2">
                                    <span class="badge badge-slate min-w-6 justify-center">{{ i.cantidad }}</span>
                                    <span class="truncate-row" style="flex:1;min-width:0">{{ i.producto }}</span>
                                  </div>
                                  <button
                                    type="button"
                                    class="btn btn-ghost btn-icon-sm shrink-0"
                                    (click)="removeFromCart(i.idUnico)"
                                    [attr.aria-label]="'Eliminar ' + i.producto + ' del carrito'"
                                  >
                                    <svg lucideCircleX [size]="17" [strokeWidth]="2" aria-hidden="true" class="text-red-600 dark:text-red-400"></svg>
                                  </button>
                                </div>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        }
      </div>

      <div class="border-t border-slate-200 p-2 dark:border-slate-700">
        <div class="mb-1 flex justify-between">
          <small class="font-bold text-slate-500 dark:text-slate-400" role="status" aria-live="polite" aria-atomic="true">
            Pedidos: {{ cartPedidoCount() }}
          </small>
        </div>
        <button
          type="button"
          class="btn btn-accent w-full shadow-sm"
          (click)="guardarYGenerar()"
          [disabled]="saving()"
        >
          @if (saving()) {
            <svg lucideLoaderCircle [size]="15" [strokeWidth]="2" aria-hidden="true" class="animate-spin"></svg> Procesando...
          } @else {
            <svg lucidePrinter [size]="16" [strokeWidth]="2" aria-hidden="true"></svg> IMPRIMIR HOJA
          }
        </button>
      </div>
    </div>
  `,
})
export class CartPanelComponent {
  private readonly estado = inject(EstadoService);
  private readonly resources = inject(ResourcesService);
  private readonly api = inject(ApiService);
  private readonly print = inject(PrintService);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);

  readonly cart = this.estado.cart;
  readonly cartPedidoCount = this.estado.cartPedidoCount;
  readonly totalEspuma = this.estado.totalEspuma;
  readonly totalResorte = this.estado.totalResorte;
  readonly chofer = this.estado.chofer;
  readonly placa = this.estado.placa;

  readonly saving = signal(false);

  private readonly closedCartClientes = signal<Set<string>>(new Set());
  private readonly closedCartAgencias = signal<Set<string>>(new Set());

  readonly total = computed(() => this.resources.meta.value()?.totalPedidos ?? 0);

  readonly choferes = computed(() => this.resources.meta.value()?.choferes ?? []);
  readonly placas = computed(() => this.resources.meta.value()?.placas ?? []);

  readonly pct = computed(() => {
    const total = this.total();
    return total > 0 ? Math.round((this.cartPedidoCount() / total) * 100) : 0;
  });

  readonly cartAgencias = computed<AgenciaGroup[]>(() => {
    const byAgencia = new Map<string, Map<string, CartPedido[]>>();
    for (const item of this.cart()) {
      let cli = byAgencia.get(item.agencia);
      if (!cli) {
        cli = new Map();
        byAgencia.set(item.agencia, cli);
      }
      let list = cli.get(item.cliente);
      if (!list) {
        list = [];
        cli.set(item.cliente, list);
      }
      let ped = list.find((p) => p.pedido === item.pedido);
      if (!ped) {
        ped = { pedido: item.pedido, items: [] };
        list.push(ped);
      }
      ped.items.push(item);
    }
    return Array.from(byAgencia.entries()).map(([agencia, clientes]) => {
      const groups: ClienteGroup[] = Array.from(clientes.entries()).map(([cliente, pedidos]) => ({
        cliente,
        agencia,
        pedidos,
        total: pedidos.length,
      }));
      const total = groups.reduce((acc, c) => acc + c.total, 0);
      return { agencia, clientes: groups, total };
    });
  });

  private sortables: Sortable[] = [];

  constructor() {
    effect(() => {
      void this.cart();
      void this.closedCartAgencias();
      this.destroySortables();
      requestAnimationFrame(() => this.initSortables());
    });
  }

  private destroySortables(): void {
    for (const s of this.sortables) s.destroy();
    this.sortables = [];
  }

  private initSortables(): void {
    const el = document.getElementById('cartList');
    if (!el || this.cart().length === 0) return;
    this.sortables.push(
      new Sortable(el, {
        animation: 150,
        handle: '.cart-agencia-header',
        ghostClass: 'sortable-ghost',
        onEnd: () => this.reorderFromDom(el),
      }),
    );
    el.querySelectorAll('.cart-agencia-body').forEach((body) => {
      this.sortables.push(
        new Sortable(body as HTMLElement, {
          animation: 150,
          handle: '.cart-client-header',
          ghostClass: 'sortable-ghost',
          onEnd: () => this.reorderFromDom(el),
        }),
      );
    });
  }

  private reorderFromDom(el: HTMLElement): void {
    const ordenado: Pedido[] = [];
    const agencias = el.querySelectorAll(':scope > .cart-agencia');
    agencias.forEach((ag) => {
      const agencia = ag.querySelector('.cart-agencia-header')?.getAttribute('data-agencia') ?? '';
      const groups = ag.querySelectorAll(':scope > .cart-agencia-body > .mb-1');
      groups.forEach((g) => {
        const header = g.querySelector('.cart-client-header');
        const cliente = header?.getAttribute('data-cliente') ?? '';
        const pedDivs = g.querySelectorAll(':scope > div:last-child > .border-start');
        pedDivs.forEach((pd) => {
          const pedText = pd.querySelector('.fw-bold.small')?.textContent?.trim() ?? '';
          this.cart()
            .filter((i) => i.pedido === pedText && i.cliente === cliente && i.agencia === agencia)
            .forEach((i) => ordenado.push(i));
        });
      });
    });
    if (ordenado.length === this.cart().length) {
      this.estado.setCartOrder(ordenado);
      this.estado.persistCart();
    }
  }

  isCartClienteOpen(cliente: string): boolean {
    return !this.closedCartClientes().has(cliente);
  }

  isCartAgenciaOpen(agencia: string): boolean {
    return !this.closedCartAgencias().has(agencia);
  }

  toggleCartCliente(cliente: string): void {
    this.closedCartClientes.update((set) => {
      const next = new Set(set);
      if (next.has(cliente)) next.delete(cliente);
      else next.add(cliente);
      return next;
    });
  }

  toggleCartAgencia(agencia: string): void {
    this.closedCartAgencias.update((set) => {
      const next = new Set(set);
      if (next.has(agencia)) next.delete(agencia);
      else next.add(agencia);
      return next;
    });
  }

  removeFromCart(idUnico: number): void {
    this.estado.removeFromCart(idUnico);
  }

  reiniciar(): void {
    this.modal.confirm('Reiniciar Jornada', 'Se reiniciará el carrito y la lista de preparados.').then((ok) => {
      if (!ok) return;
      this.estado.resetSession();
      this.chofer.set('');
      this.placa.set('');
      this.toast.show('Jornada reiniciada');
    });
  }

  async guardarYGenerar(): Promise<void> {
    const chofer = this.chofer();
    const placa = this.placa();
    const cart = this.cart();
    if (cart.length === 0 || !chofer || !placa) {
      this.toast.show('Complete chofer, placa y seleccione pedidos', 'warning');
      return;
    }

    this.saving.set(true);
    try {
      const res = await this.api.post<GuardarResult>('guardar', { chofer, placa, items: cart });
      const prepData = this.estado.markDispatched(cart);
      this.estado.recordDispatchPrepared(res.id, prepData);
      this.resources.refresh();
      this.chofer.set('');
      this.placa.set('');
      this.print.generar(res);
      this.toast.show('Hoja de carga generada: ' + res.id);
    } catch (err) {
      this.toast.showError('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      this.saving.set(false);
    }
  }
}
