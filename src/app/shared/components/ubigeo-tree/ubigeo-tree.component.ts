import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { LucideCheckCheck, LucideChevronDown, LucideChevronRight, LucideEye, LucideEyeOff, LucideHouse, LucideInbox, LucideMapPin, LucideUser } from '@lucide/angular';
import { Pedido } from '../../../core/models/pedido.model';
import { ClienteGroup, PedidoItems, UbigeoGroup } from '../../utils/pedido-utils';
import { EstadoService } from '../../../core/state/estado.service';
import { ModalService } from '../../ui/modal.service';

@Component({
  selector: 'app-ubigeo-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideCheckCheck, LucideChevronDown, LucideChevronRight, LucideEye, LucideEyeOff, LucideHouse, LucideInbox, LucideMapPin, LucideUser],
  template: `
    <div class="flex h-full flex-col">
      @if (loading()) {
        <div class="p-2">
          <div class="skeleton skeleton-block"></div>
          <div class="skeleton skeleton-block" style="height:36px"></div>
          <div class="skeleton skeleton-block" style="height:36px"></div>
          <div class="skeleton skeleton-block" style="height:36px"></div>
        </div>
      } @else if (groups().length === 0) {
        <div class="py-5 text-center text-sm text-slate-500" role="status">
          <svg lucideInbox [size]="32" [strokeWidth]="1.5" aria-hidden="true" class="mx-auto mb-2 opacity-40"></svg>
          {{ emptyText() }}
        </div>
      } @else {
        <div class="flex-1 overflow-auto p-1" role="tree" aria-label="Árbol de pedidos por ubicación">
          @for (g of groups(); track g.ubigeo) {
            <div class="mb-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                class="flex min-h-11 w-full items-center justify-between gap-2 bg-indigo-600 px-3 py-2 text-left text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                (click)="toggleUbigeo(g.ubigeo)"
                [attr.aria-expanded]="isUbigeoOpen(g.ubigeo)"
                [attr.aria-label]="ubigeoAria(g)"
              >
                <span class="flex min-w-0 items-center gap-1.5">
                  <svg lucideMapPin [size]="15" [strokeWidth]="2" aria-hidden="true"></svg>
                  <span class="truncate">{{ g.ubigeo }}</span>
                  @if (mode() === 'prepare') {
                    <span class="badge badge-white ml-1">{{ ubigeoPrepared(g) }}/{{ g.total }}</span>
                  } @else {
                    <span class="badge badge-white ml-1">{{ g.total }}</span>
                    @if (cartCount(g) > 0) {
                      <span class="badge badge-success ml-1">{{ cartCount(g) }}</span>
                    }
                    @if (processedCount(g) > 0) {
                      <span class="badge badge-slate ml-1 opacity-70">{{ processedCount(g) }} en ruta</span>
                    }
                  }
                </span>
                <svg lucideChevronDown [size]="16" [strokeWidth]="2" aria-hidden="true" [class.rotate-180]="isUbigeoOpen(g.ubigeo)" class="shrink-0 transition-transform"></svg>
              </button>

              @if (isUbigeoOpen(g.ubigeo)) {
                <div class="bg-white p-1 dark:bg-slate-900">
                  @if (mode() === 'prepare' && !allPrepared(g)) {
                    <div class="mb-1 flex justify-end">
                      <button type="button" class="btn btn-primary btn-xs" (click)="prepareAll(g)">
                        <svg lucideCheckCheck [size]="13" [strokeWidth]="2" aria-hidden="true"></svg>Preparar todos
                      </button>
                    </div>
                  }
                  @for (c of g.clientes; track c.cliente) {
                    <div class="mb-1 ml-1 mr-1 rounded-md border-l-4 border-indigo-500 bg-white p-1 shadow-sm dark:bg-slate-900">
                      <div
                        class="flex min-h-11 cursor-pointer items-center justify-start gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400"
                        (click)="toggleCliente(clienteKey(g, c))"
                        role="button"
                        tabindex="0"
                        [attr.aria-expanded]="isClienteOpen(clienteKey(g, c))"
                      >
                        <svg
                          lucideChevronRight
                          [size]="15"
                          [strokeWidth]="2"
                          aria-hidden="true"
                          [class.rotate-chevron]="isClienteOpen(clienteKey(g, c))"
                        ></svg>
                        <svg lucideUser [size]="14" [strokeWidth]="2" aria-hidden="true"></svg>
                        <span class="truncate">{{ c.cliente }}</span>
                        <span class="badge badge-primary max-w-24 truncate">{{ c.agencia }}</span>
                        @if (mode() === 'prepare' && clienteAllPrepared(c)) {
                          <span class="badge badge-success">✓</span>
                        }
                        <small class="ml-auto mr-1 whitespace-nowrap text-xs font-normal text-slate-500">{{ c.total }} ped.</small>
                      </div>

                      @if (isClienteOpen(clienteKey(g, c))) {
                        <div>
                          @for (pi of c.pedidos; track pi.pedido) {
                            @if (visiblePedido(pi)) {
                              <div
                                class="mb-1 border-b border-slate-200 last:mb-0 dark:border-slate-700"
                                [class.border-l-4]="mode() === 'dispatch' && (pedInCart(pi) || pedProcessed(pi))"
                                [class.border-emerald-500]="mode() === 'dispatch' && pedInCart(pi)"
                                [class.bg-emerald-50]="mode() === 'dispatch' && pedInCart(pi)"
                                [class.dark:bg-emerald-500/10]="mode() === 'dispatch' && pedInCart(pi)"
                                [class.border-slate-400]="mode() === 'dispatch' && pedProcessed(pi)"
                                [class.bg-slate-100]="mode() === 'dispatch' && pedProcessed(pi)"
                                [class.dark:bg-slate-800]="mode() === 'dispatch' && pedProcessed(pi)"
                              >
                                <div class="flex items-center gap-1.5 bg-slate-100 px-2 py-1 dark:bg-slate-800">
                                  <span class="font-mono min-w-0 truncate text-sm font-semibold text-slate-800 dark:text-slate-100" [class.line-through]="mode() === 'dispatch' && pedProcessed(pi)">{{ pi.pedido }}</span>
                                  @if (mode() === 'dispatch' && pedInCart(pi)) {
                                    <span class="badge badge-success">✓ LISTA</span>
                                  } @else if (mode() === 'dispatch' && pedProcessed(pi)) {
                                    <span class="badge badge-slate">EN RUTA</span>
                                  }
                                  <span class="badge badge-slate">{{ fecha(pi) }}</span>
                                  <span class="badge badge-amber">{{ pi.items[0].estado }}</span>
                                  @if (cantEspumas(pi) > 0) {
                                    <span class="badge badge-espuma">E:{{ cantEspumas(pi) }}</span>
                                  }
                                  @if (cantResortes(pi) > 0) {
                                    <span class="badge badge-resorte">R:{{ cantResortes(pi) }}</span>
                                  }
                                  <span class="ml-auto flex shrink-0 items-center gap-1">
                                    <button
                                      type="button"
                                      class="btn btn-ghost btn-icon-sm"
                                      (click)="showDir(pi)"
                                      [attr.aria-label]="'Ver dirección de llegada del pedido ' + pi.pedido"
                                    >
                                      @if (pi.items[0].direccion.trim()) {
                                        <svg lucideHouse [size]="15" [strokeWidth]="2" aria-hidden="true" class="text-indigo-600 dark:text-indigo-400"></svg>
                                      } @else {
                                        <svg lucideHouse [size]="15" [strokeWidth]="2" aria-hidden="true" class="opacity-25"></svg>
                                      }
                                    </button>
                                    <button
                                      type="button"
                                      class="btn btn-ghost btn-icon-sm"
                                      (click)="showObs(pi)"
                                      [attr.aria-label]="'Ver observación del pedido ' + pi.pedido"
                                    >
                                      @if (pi.items[0].observacion.trim()) {
                                        <svg lucideEye [size]="15" [strokeWidth]="2" aria-hidden="true" class="text-red-600 dark:text-red-400"></svg>
                                      } @else {
                                        <svg lucideEyeOff [size]="15" [strokeWidth]="2" aria-hidden="true" class="opacity-25"></svg>
                                      }
                                    </button>
                                  </span>
                                  <span class="badge badge-slate">{{ pi.items.length }} it.</span>
                                </div>
                                <div class="bg-white dark:bg-slate-900">
                                  <table class="table text-xs">
                                    @for (i of pi.items; track i.idUnico) {
                                      <tr class="border-t border-slate-200 first:border-t-0 dark:border-slate-700">
                                        <td class="pl-3">{{ i.producto }}</td>
                                        <td class="w-10 text-center font-bold text-indigo-600 dark:text-indigo-400">{{ i.cantidad }}</td>
                                      </tr>
                                    }
                                  </table>
                                  @if (mode() === 'prepare') {
                                    <button
                                      type="button"
                                      class="btn w-full justify-center rounded-md"
                                      [class.btn-success]="isPrepared(pi)"
                                      [class.btn-outline]="!isPrepared(pi)"
                                      (click)="togglePrepare(pi)"
                                    >
                                      {{ isPrepared(pi) ? '✓ Preparado' : 'Preparar' }}
                                    </button>
                                  } @else {
                                    <button
                                      type="button"
                                      class="btn btn-outline w-full justify-center rounded-md"
                                      [class.text-emerald-600]="pedInCart(pi)"
                                      [class.dark:text-emerald-400]="pedInCart(pi)"
                                      [class.text-slate-400]="pedProcessed(pi)"
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