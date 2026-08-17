import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import Sortable from 'sortablejs';
import { FiltrosBarComponent } from '../../shared/components/filtros-bar/filtros-bar.component';
import { UbigeoTreeComponent } from '../../shared/components/ubigeo-tree/ubigeo-tree.component';
import { ResourcesService } from '../../core/resources/resources.service';
import { FiltrosService } from '../../core/state/filtros.service';
import { EstadoService } from '../../core/state/estado.service';
import { ApiService } from '../../core/api/api.service';
import { PrintService } from '../../core/services/print.service';
import { ModalService } from '../../shared/ui/modal.service';
import { ToastService } from '../../shared/ui/toast.service';
import { GuardarResult } from '../../core/models/despacho.model';
import { Pedido } from '../../core/models/pedido.model';
import { PedidoItems, UbigeoGroup, agruparPorUbigeo, filtrarPedidos } from '../../shared/utils/pedido-utils';

interface CartCliente {
  cliente: string;
  pedidos: CartPedido[];
}

interface CartPedido {
  pedido: string;
  items: Pedido[];
}

@Component({
  selector: 'app-despachar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FiltrosBarComponent, UbigeoTreeComponent],
  template: `
    <div class="d-flex flex-column h-100dvh min-h-0">
      <app-filtros-bar tab="desp" />

      <div class="panel-toggle bg-card" role="tablist">
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          [class.active]="activePanel() === 'tree'"
          (click)="activePanel.set('tree')"
        >
          <i class="bi bi-list-tree me-1"></i>Pedidos
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          [class.active]="activePanel() === 'cart'"
          (click)="activePanel.set('cart')"
        >
          <i class="bi bi-cart4 me-1"></i>Preparación
          @if (cartPedidoCount() > 0) {
            <span class="badge bg-primary ms-1" style="font-size:0.6rem">{{ cartPedidoCount() }}</span>
          }
        </button>
      </div>

      <div class="split-container">
        <div class="panel-left" [class.d-none]="activePanel() === 'cart'">
          <div class="input-group input-group-sm mb-2">
            <span class="input-group-text bg-card"><i class="bi bi-search"></i></span>
            <input
              id="txtBuscarDespacho"
              type="text"
              class="form-control"
              placeholder="Buscar en despacho..."
              aria-label="Buscar en despacho"
              [value]="filtros().texto"
              (input)="setTexto($any($event.target).value)"
            />
          </div>
          <div class="flex-grow-1 min-h-0">
            <app-ubigeo-tree mode="dispatch" [groups]="grupos()" [loading]="loading()" />
          </div>
        </div>

        <div class="panel-right" [class.d-none]="activePanel() === 'tree'">
          <div class="p-2 bg-primary text-white d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <h6 class="m-0 small me-2"><i class="bi bi-cart4"></i> Preparación</h6>
              <span class="badge badge-espuma" role="status" aria-live="polite">E:{{ totalEspuma() }}</span>
              <span class="badge badge-resorte ms-1" role="status" aria-live="polite">R:{{ totalResorte() }}</span>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-outline-light py-0 fw-bold text-xs"
              (click)="reiniciar()"
              title="Borrar todo y empezar jornada nueva"
            >
              <i class="bi bi-arrow-repeat"></i> Reiniciar
            </button>
          </div>

          <div class="p-2 bg-light border-bottom">
            <div class="row g-1">
              <div class="col-6">
                <label class="small fw-bold" for="selChofer">Chofer</label>
                <select id="selChofer" class="form-select form-select-sm" [value]="chofer()" (change)="chofer.set($any($event.target).value)">
                  <option value="">-- Seleccionar --</option>
                  @for (c of choferes(); track c) {
                    <option [value]="c">{{ c }}</option>
                  }
                </select>
              </div>
              <div class="col-6">
                <label class="small fw-bold" for="selPlaca">Placa</label>
                <select id="selPlaca" class="form-select form-select-sm" [value]="placa()" (change)="placa.set($any($event.target).value)">
                  <option value="">-- Seleccionar --</option>
                  @for (p of placas(); track p) {
                    <option [value]="p">{{ p }}</option>
                  }
                </select>
              </div>
            </div>
          </div>

          <div class="px-2 pt-1 pb-0 bg-light border-bottom">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <small class="text-muted-fg fw-semibold">{{ cartPedidoCount() }} / {{ total() }} pedidos</small>
              <small class="fw-bold text-primary-fg" style="font-size:0.75rem">{{ pct() }}%</small>
            </div>
            <div class="progress mb-1" style="height:6px;border-radius:3px">
              <div
                class="progress-bar"
                role="progressbar"
                [style.width.%]="pct()"
                [attr.aria-valuenow]="pct()"
                aria-valuemin="0"
                aria-valuemax="100"
                style="border-radius:3px;background:linear-gradient(90deg,var(--color-primary),var(--color-accent))"
              ></div>
            </div>
          </div>

          <div class="flex-grow-1 overflow-auto p-2" #cartList id="cartList">
            @if (cart().length === 0) {
              <div class="text-center text-muted mt-5 small" role="status">
                <i class="bi bi-inbox empty-icon" aria-hidden="true"></i>Selecciona pedidos del panel izquierdo
              </div>
            } @else {
              @for (cli of cartClientes(); track cli.cliente; let idx = $index) {
                <div class="mb-1 cart-item-card" style="animation-delay:{{ idx * 0.04 }}s">
                  <div
                    class="bg-light px-2 py-1 rounded-top border-start border-3 border-primary d-flex align-items-center justify-content-between cart-client-header"
                    style="min-height:44px"
                    (click)="toggleCartCliente(cli.cliente)"
                    role="button"
                    tabindex="0"
                    [attr.data-cliente]="cli.cliente"
                    [attr.aria-expanded]="isCartClienteOpen(cli.cliente)"
                  >
                    <small class="fw-bold text-primary">
                      <i class="bi bi-grip-vertical drag-handle text-muted" aria-hidden="true"></i>
                      <i class="bi bi-person-fill me-1" aria-hidden="true"></i>{{ cli.cliente }}
                    </small>
                    <small class="text-muted-fg">{{ cli.pedidos.length }} ped.</small>
                  </div>
                  @if (isCartClienteOpen(cli.cliente)) {
                    <div>
                      @for (pi of cli.pedidos; track pi.pedido) {
                        <div class="bg-card px-2 py-1 border-start border-3 border-success border-bottom">
                          <div class="fw-bold small text-dark d-flex justify-content-between">
                            <span class="font-mono">{{ pi.pedido }}</span>
                          </div>
                          @for (i of pi.items; track i.idUnico) {
                            <div class="d-flex justify-content-between align-items-center small text-muted border-top mt-1 pt-1" style="overflow:hidden">
                              <div class="d-flex align-items-center overflow-hidden">
                                <span class="badge bg-secondary me-2 text-nowrap" style="min-width:25px">{{ i.cantidad }}</span>
                                <span class="text-truncate truncate-row" style="flex:1;min-width:0">{{ i.producto }}</span>
                              </div>
                              <button
                                type="button"
                                class="btn btn-sm border-0 touch-target-sm btn-ghost"
                                (click)="removeFromCart(i.idUnico)"
                                [attr.aria-label]="'Eliminar ' + i.producto + ' del carrito'"
                              >
                                <i class="bi bi-x-circle text-danger" style="font-size:1.1rem"></i>
                              </button>
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

          <div class="p-2 border-top">
            <div class="d-flex justify-content-between mb-1">
              <small class="fw-bold text-muted" role="status" aria-live="polite" aria-atomic="true">
                Pedidos: {{ cartPedidoCount() }}
              </small>
            </div>
            <button
              type="button"
              class="btn btn-accent w-100 btn-sm fw-bold shadow-sm"
              (click)="guardarYGenerar()"
              [disabled]="saving()"
            >
              @if (saving()) {
                <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Procesando...
              } @else {
                <i class="bi bi-printer"></i> IMPRIMIR HOJA
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .split-container { display: flex; flex: 1; min-height: 0; }
      .panel-left {
        width: 60%; max-width: 800px; flex-shrink: 0; display: flex; flex-direction: column;
        padding: var(--space-3); border-right: 1px solid var(--color-border); overflow-y: auto;
      }
      .panel-right { flex: 1; min-width: 0; display: flex; flex-direction: column; background: var(--color-card); }
      .panel-toggle { display: none; }
      .panel-toggle .btn { border-radius: 0; flex: 1; }
      .panel-toggle .btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
      @media (max-width: 1024px) {
        .split-container { flex-direction: column; }
        .panel-left, .panel-right { width: 100%; max-height: none; flex: 1 1 auto; }
        .panel-left { border-right: none; padding: var(--space-2); }
        .panel-right { box-shadow: none; border-top: 2px solid var(--color-primary); }
        .panel-toggle { display: flex; border-bottom: 1px solid var(--color-border); }
        .panel-toggle .btn { font-size: 0.85rem; padding: 10px 12px; min-height: 44px; }
      }
      .cart-client-header { user-select: none; }
    `,
  ],
})
export class DespacharComponent {
  private readonly resources = inject(ResourcesService);
  private readonly filtrosSvc = inject(FiltrosService);
  readonly estado = inject(EstadoService);
  private readonly api = inject(ApiService);
  private readonly print = inject(PrintService);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);

  readonly filtros = this.filtrosSvc.desp;

  readonly chofer = this.estado.chofer;
  readonly placa = this.estado.placa;
  readonly saving = signal(false);
  readonly activePanel = signal<'tree' | 'cart'>('tree');

  private readonly closedCartClientes = signal<Set<string>>(new Set());

  readonly grupos = computed<UbigeoGroup[]>(() => {
    const prepared = this.estado.preparedItems();
    if (prepared.length === 0) return [];
    const iso = this.filtrosSvc.isoField(this.filtros().campoFecha);
    const filt = filtrarPedidos(prepared, this.filtros(), iso);
    return agruparPorUbigeo(filt);
  });

  readonly loading = computed(() => this.resources.pedidosAll.isLoading());
  readonly total = computed(() => this.resources.meta.value()?.totalPedidos ?? 0);
  readonly cart = this.estado.cart;
  readonly cartPedidoCount = this.estado.cartPedidoCount;
  readonly totalEspuma = this.estado.totalEspuma;
  readonly totalResorte = this.estado.totalResorte;
  readonly choferes = computed(() => this.resources.meta.value()?.choferes ?? []);
  readonly placas = computed(() => this.resources.meta.value()?.placas ?? []);

  readonly pct = computed(() => {
    const total = this.total();
    return total > 0 ? Math.round((this.cartPedidoCount() / total) * 100) : 0;
  });

  readonly cartClientes = computed<CartCliente[]>(() => {
    const map = new Map<string, CartPedido[]>();
    for (const item of this.cart()) {
      let list = map.get(item.cliente);
      if (!list) {
        list = [];
        map.set(item.cliente, list);
      }
      let ped = list.find((p) => p.pedido === item.pedido);
      if (!ped) {
        ped = { pedido: item.pedido, items: [] };
        list.push(ped);
      }
      ped.items.push(item);
    }
    return Array.from(map.entries()).map(([cliente, pedidos]) => ({ cliente, pedidos }));
  });

  private sortable: Sortable | null = null;

  constructor() {
    effect(() => {
      void this.cart();
      if (this.sortable) {
        this.sortable.destroy();
        this.sortable = null;
      }
      requestAnimationFrame(() => this.initSortable());
    });
  }

  private initSortable(): void {
    const el = document.getElementById('cartList');
    if (!el || this.cart().length === 0) return;
    this.sortable = new Sortable(el, {
      animation: 150,
      handle: '.cart-client-header',
      ghostClass: 'bg-muted',
      onEnd: () => this.reorderFromDom(el),
    });
  }

  private reorderFromDom(el: HTMLElement): void {
    const ordenado: Pedido[] = [];
    const groups = el.querySelectorAll(':scope > .mb-1');
    groups.forEach((g) => {
      const header = g.querySelector('.cart-client-header');
      const cliente = header?.getAttribute('data-cliente') ?? '';
      const pedDivs = g.querySelectorAll(':scope > div:last-child > .border-start');
      pedDivs.forEach((pd) => {
        const pedText = pd.querySelector('.fw-bold.small')?.textContent?.trim() ?? '';
        this.cart()
          .filter((i) => i.pedido === pedText && i.cliente === cliente)
          .forEach((i) => ordenado.push(i));
      });
    });
    if (ordenado.length === this.cart().length) {
      this.estado.setCartOrder(ordenado);
      this.estado.persistCart();
    }
  }

  setTexto(value: string): void {
    this.filtrosSvc.updateDesp({ texto: value });
  }

  isCartClienteOpen(cliente: string): boolean {
    return !this.closedCartClientes().has(cliente);
  }

  toggleCartCliente(cliente: string): void {
    this.closedCartClientes.update((set) => {
      const next = new Set(set);
      if (next.has(cliente)) next.delete(cliente);
      else next.add(cliente);
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