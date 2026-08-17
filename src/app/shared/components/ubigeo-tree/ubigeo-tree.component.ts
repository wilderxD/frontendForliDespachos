import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Pedido } from '../../../core/models/pedido.model';
import { ClienteGroup, PedidoItems, UbigeoGroup } from '../../utils/pedido-utils';
import { EstadoService } from '../../../core/state/estado.service';
import { ModalService } from '../../ui/modal.service';

@Component({
  selector: 'app-ubigeo-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="d-flex flex-column h-100">
      @if (loading()) {
        <div class="p-2">
          <div class="skeleton skeleton-block"></div>
          <div class="skeleton skeleton-block" style="height:36px"></div>
          <div class="skeleton skeleton-block" style="height:36px"></div>
          <div class="skeleton skeleton-block" style="height:36px"></div>
        </div>
      } @else if (groups().length === 0) {
        <div class="text-center text-muted py-5 small" role="status">
          <i class="bi bi-inbox empty-icon" aria-hidden="true"></i>
          {{ emptyText() }}
        </div>
      } @else {
        <div class="flex-grow-1 overflow-auto p-1" role="tree" aria-label="Árbol de pedidos por ubicación">
          @for (g of groups(); track g.ubigeo) {
            <div class="ubigeo-container">
              <button
                type="button"
                class="ubigeo-header-btn"
                (click)="toggleUbigeo(g.ubigeo)"
                [attr.aria-expanded]="isUbigeoOpen(g.ubigeo)"
                [attr.aria-label]="ubigeoAria(g)"
              >
                <span class="d-inline-flex align-items-center text-start" style="min-width:0">
                  <i class="bi bi-geo-alt-fill me-1" aria-hidden="true"></i>
                  <span class="truncate-row">{{ g.ubigeo }}</span>
                  @if (mode() === 'prepare') {
                    <span class="badge bg-white text-primary ms-2 text-nowrap" style="font-size:0.65rem">
                      {{ ubigeoPrepared(g) }}/{{ g.total }}
                    </span>
                  } @else {
                    <span class="badge bg-white text-primary ms-2 text-nowrap" style="font-size:0.65rem">
                      {{ g.total }}
                    </span>
                    @if (cartCount(g) > 0) {
                      <span class="badge bg-success ms-1 text-nowrap" style="font-size:0.65rem">{{ cartCount(g) }}</span>
                    }
                    @if (processedCount(g) > 0) {
                      <span class="badge bg-light text-muted ms-1 text-nowrap" style="font-size:0.65rem;opacity:0.7">
                        {{ processedCount(g) }} en ruta
                      </span>
                    }
                  }
                </span>
              </button>

              @if (isUbigeoOpen(g.ubigeo)) {
                <div class="ubigeo-body p-1">
                  @if (mode() === 'prepare' && !allPrepared(g)) {
                    <div class="d-flex justify-content-end mb-1">
                      <button type="button" class="btn btn-xs btn-outline-primary" (click)="prepareAll(g)">
                        <i class="bi bi-check-all me-1"></i>Preparar todos
                      </button>
                    </div>
                  }
                  @for (c of g.clientes; track c.cliente) {
                    <div class="block-cliente">
                      <div
                        class="header-cliente cursor-pointer touch-target justify-content-start"
                        (click)="toggleCliente(clienteKey(g, c))"
                        role="button"
                        tabindex="0"
                        [attr.aria-expanded]="isClienteOpen(clienteKey(g, c))"
                      >
                        <i
                          class="bi bi-chevron-right me-1"
                          [class.rotate-chevron]="isClienteOpen(clienteKey(g, c))"
                          aria-hidden="true"
                        ></i>
                        <i class="bi bi-person-fill me-1" aria-hidden="true"></i>
                        <span class="truncate-row">{{ c.cliente }}</span>
                        <span class="agency-badge text-truncate">{{ c.agencia }}</span>
                        @if (mode() === 'prepare' && clienteAllPrepared(c)) {
                          <span class="badge bg-success text-white ms-1" style="font-size:0.6rem">✓</span>
                        }
                        <small class="text-muted-fg ms-auto me-1 text-nowrap">{{ c.total }} ped.</small>
                      </div>

                      @if (isClienteOpen(clienteKey(g, c))) {
                        <div class="accordion">
                          @for (pi of c.pedidos; track pi.pedido) {
                            @if (visiblePedido(pi)) {
                              <div class="accordion-item mb-1 border-0 border-bottom {{ pedStatusClass(pi) }}">
                                <div class="d-flex align-items-center flex-nowrap touch-gap-sm px-2 py-1 accordion-header-pedido">
                                  <span class="order-title font-mono truncate-row">{{ pi.pedido }}</span>
                                  @if (mode() === 'dispatch' && pedInCart(pi)) {
                                    <span class="badge bg-success text-white ms-1 text-nowrap" style="font-size:0.6rem">✓ LISTA</span>
                                  } @else if (mode() === 'dispatch' && pedProcessed(pi)) {
                                    <span class="badge bg-secondary text-white ms-1 text-nowrap" style="font-size:0.6rem">EN RUTA</span>
                                  }
                                  <span class="date-badge text-nowrap">{{ fecha(pi) }}</span>
                                  <span class="status-badge text-nowrap">{{ pi.items[0].estado }}</span>
                                  @if (cantEspumas(pi) > 0) {
                                    <span class="badge-espuma text-nowrap">E:{{ cantEspumas(pi) }}</span>
                                  }
                                  @if (cantResortes(pi) > 0) {
                                    <span class="badge-resorte text-nowrap">R:{{ cantResortes(pi) }}</span>
                                  }
                                  <span class="ms-auto d-inline-flex align-items-center touch-gap-sm flex-shrink-0">
                                    <button
                                      type="button"
                                      class="btn btn-sm border-0 p-0 touch-target-sm btn-ghost"
                                      (click)="showDir(pi)"
                                      [attr.aria-label]="'Ver dirección de llegada del pedido ' + pi.pedido"
                                    >
                                      @if (pi.items[0].direccion.trim()) {
                                        <i class="bi bi-house-door-fill text-primary-fg"></i>
                                      } @else {
                                        <i class="bi bi-house-door text-muted opacity-25" aria-hidden="true"></i>
                                      }
                                    </button>
                                    <button
                                      type="button"
                                      class="btn btn-sm border-0 p-0 touch-target-sm btn-ghost"
                                      (click)="showObs(pi)"
                                      [attr.aria-label]="'Ver observación del pedido ' + pi.pedido"
                                    >
                                      @if (pi.items[0].observacion.trim()) {
                                        <i class="bi bi-eye-fill text-danger"></i>
                                      } @else {
                                        <i class="bi bi-eye-slash text-muted opacity-25" aria-hidden="true"></i>
                                      }
                                    </button>
                                  </span>
                                  <span class="badge bg-light text-secondary border text-xs ms-1 text-nowrap">
                                    {{ pi.items.length }} it.
                                  </span>
                                </div>
                                <div class="accordion-body p-0">
                                  <table class="table table-sm table-bordered mb-0 table-striped text-xs">
                                    @for (i of pi.items; track i.idUnico) {
                                      <tr>
                                        <td class="ps-3">{{ i.producto }}</td>
                                        <td class="text-center fw-bold text-primary" style="width:40px">{{ i.cantidad }}</td>
                                      </tr>
                                    }
                                  </table>
                                  @if (mode() === 'prepare') {
                                    <button
                                      type="button"
                                      class="btn btn-sm btn-agregar btn-outline-card w-100 fw-bold btn-prepare"
                                      [class.prepared]="isPrepared(pi)"
                                      (click)="togglePrepare(pi)"
                                    >
                                      {{ isPrepared(pi) ? '✓ Preparado' : 'Preparar' }}
                                    </button>
                                  } @else {
                                    <button
                                      type="button"
                                      class="btn btn-sm btn-agregar btn-outline-card w-100 fw-bold"
                                      [class.text-success]="pedInCart(pi)"
                                      [class.text-muted]="pedProcessed(pi)"
                                      (click)="addToCart(pi)"
                                      [disabled]="pedInCart(pi) || pedProcessed(pi)"
                                    >
                                      @if (pedInCart(pi)) {
                                        EN LISTA ✓
                                      } @else if (pedProcessed(pi)) {
                                        EN RUTA
                                      } @else {
                                        AGREGAR (+)
                                      }
                                    </button>
                                  }
                                </div>
                              </div>
                            }
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
    </div>
  `,
  styles: [
    `
      .rotate-chevron { transform: rotate(90deg); transition: transform 0.15s ease; }
      .accordion-header-pedido { background-color: var(--color-muted); }
      :host ::ng-deep .accordion-body { background: var(--color-card); }
      @media (prefers-reduced-motion: reduce) {
        .rotate-chevron { transition: none; }
      }
    `,
  ],
})
export class UbigeoTreeComponent {
  readonly mode = input<'prepare' | 'dispatch'>('prepare');
  readonly groups = input<UbigeoGroup[]>([]);
  readonly loading = input(false);

  private readonly estado = inject(EstadoService);
  private readonly modal = inject(ModalService);

  private readonly expandedUbigeos = signal<Set<string>>(new Set());
  private readonly expandedClientes = signal<Set<string>>(new Set());

  readonly emptyText = computed(() =>
    this.mode() === 'prepare'
      ? 'No hay pedidos para esta combinación de filtros'
      : 'No hay pedidos preparados para despachar',
  );

  isUbigeoOpen(ubigeo: string): boolean {
    return this.expandedUbigeos().has(ubigeo);
  }

  isClienteOpen(key: string): boolean {
    return this.expandedClientes().has(key);
  }

  toggleUbigeo(ubigeo: string): void {
    this.expandedUbigeos.update((set) => {
      const next = new Set(set);
      if (next.has(ubigeo)) next.delete(ubigeo);
      else next.add(ubigeo);
      return next;
    });
  }

  toggleCliente(key: string): void {
    this.expandedClientes.update((set) => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  clienteKey(g: UbigeoGroup, c: ClienteGroup): string {
    return g.ubigeo + '\u0000' + c.cliente;
  }

  ubigeoAria(g: UbigeoGroup): string {
    return `${g.ubigeo}, ${g.total} pedidos`;
  }

  ubigeoPrepared(g: UbigeoGroup): number {
    let count = 0;
    for (const c of g.clientes) for (const p of c.pedidos) if (this.estado.isPrepared(p.pedido)) count++;
    return count;
  }

  allPrepared(g: UbigeoGroup): boolean {
    return this.ubigeoPrepared(g) === g.total;
  }

  clienteAllPrepared(c: ClienteGroup): boolean {
    return c.pedidos.every((p) => this.estado.isPrepared(p.pedido));
  }

  prepareAll(g: UbigeoGroup): void {
    for (const c of g.clientes) {
      for (const pi of c.pedidos) {
        if (!this.estado.isPrepared(pi.pedido)) this.estado.togglePrepare(pi.pedido, pi.items);
      }
    }
  }

  cartCount(g: UbigeoGroup): number {
    let count = 0;
    for (const c of g.clientes) for (const p of c.pedidos) if (this.pedInCart(p)) count++;
    return count;
  }

  processedCount(g: UbigeoGroup): number {
    let count = 0;
    for (const c of g.clientes) for (const p of c.pedidos) if (this.pedProcessed(p)) count++;
    return count;
  }

  visiblePedido(pi: PedidoItems): boolean {
    if (this.mode() === 'prepare') return !this.estado.isProcessed(pi.pedido);
    return this.estado.isPrepared(pi.pedido);
  }

  pedStatusClass(pi: PedidoItems): string {
    if (this.mode() === 'dispatch') {
      if (this.pedInCart(pi)) return 'status-in-cart';
      if (this.pedProcessed(pi)) return 'status-processed';
    }
    return '';
  }

  pedInCart(pi: PedidoItems): boolean {
    return this.estado.isInCart(pi.pedido);
  }

  pedProcessed(pi: PedidoItems): boolean {
    return this.estado.isProcessed(pi.pedido);
  }

  isPrepared(pi: PedidoItems): boolean {
    return this.estado.isPrepared(pi.pedido);
  }

  fecha(pi: PedidoItems): string {
    return pi.items[0].fecha || '';
  }

  cantEspumas(pi: PedidoItems): number {
    return pi.items
      .filter((i) => i.linea.includes('ESPUMA') && i.producto.toUpperCase().includes('COLCHON'))
      .reduce((acc, curr) => acc + (curr.cantidad || 0), 0);
  }

  cantResortes(pi: PedidoItems): number {
    return pi.items
      .filter((i) => i.linea.includes('RESORTE'))
      .reduce((acc, curr) => acc + (curr.cantidad || 0), 0);
  }

  togglePrepare(pi: PedidoItems): void {
    this.estado.togglePrepare(pi.pedido, pi.items);
  }

  addToCart(pi: PedidoItems): void {
    if (!this.pedInCart(pi) && !this.pedProcessed(pi)) {
      this.estado.addToCart(pi.items);
    }
  }

  showObs(pi: PedidoItems): void {
    const obs = pi.items[0].observacion?.trim();
    if (obs) this.modal.info('Observación', obs);
  }

  showDir(pi: PedidoItems): void {
    const dir = pi.items[0].direccion?.trim();
    if (dir) this.modal.info('Dirección de Llegada', dir);
  }
}
