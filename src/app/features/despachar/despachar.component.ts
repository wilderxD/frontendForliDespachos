import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LucideFolderTree, LucideSearch, LucideShoppingCart } from '@lucide/angular';
import { FiltrosBarComponent } from '../../shared/components/filtros-bar/filtros-bar.component';
import { UbigeoTreeComponent } from '../../shared/components/ubigeo-tree/ubigeo-tree.component';
import { CartPanelComponent } from '../../shared/components/cart-panel/cart-panel.component';
import { ResourcesService } from '../../core/resources/resources.service';
import { FiltrosService } from '../../core/state/filtros.service';
import { EstadoService } from '../../core/state/estado.service';
import { UbigeoGroup, agruparPorUbigeo, filtrarPedidos } from '../../shared/utils/pedido-utils';

@Component({
  selector: 'app-despachar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FiltrosBarComponent, UbigeoTreeComponent, CartPanelComponent, LucideFolderTree, LucideSearch, LucideShoppingCart],
  template: `
    <div class="flex h-full min-h-0 flex-col">
      <app-filtros-bar tab="desp" />

      <div class="flex border-b border-slate-200 bg-white lg:hidden dark:border-slate-800 dark:bg-slate-900" role="tablist">
        <button
          type="button"
          class="min-h-11 flex-1 px-3 text-sm font-semibold transition-colors"
          [class.bg-indigo-600]="activePanel() === 'tree'"
          [class.text-white]="activePanel() === 'tree'"
          [class.text-slate-600]="activePanel() !== 'tree'"
          [class.dark:text-slate-300]="activePanel() !== 'tree'"
          (click)="activePanel.set('tree')"
        >
          <span class="inline-flex items-center gap-1.5">
            <svg lucideFolderTree [size]="15" [strokeWidth]="2" aria-hidden="true"></svg>Pedidos
          </span>
        </button>
        <div class="w-px bg-slate-200 dark:bg-slate-700"></div>
        <button
          type="button"
          class="min-h-11 flex-1 px-3 text-sm font-semibold transition-colors"
          [class.bg-indigo-600]="activePanel() === 'cart'"
          [class.text-white]="activePanel() === 'cart'"
          [class.text-slate-600]="activePanel() !== 'cart'"
          [class.dark:text-slate-300]="activePanel() !== 'cart'"
          (click)="activePanel.set('cart')"
        >
          <span class="inline-flex items-center gap-1.5">
            <svg lucideShoppingCart [size]="15" [strokeWidth]="2" aria-hidden="true"></svg>Preparación
            @if (cartPedidoCount() > 0) {
              <span class="badge badge-white">{{ cartPedidoCount() }}</span>
            }
          </span>
        </button>
      </div>

      <div class="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div
          class="flex min-h-0 basis-full flex-col gap-2 overflow-y-auto border-b border-slate-200 p-3 dark:border-slate-700 lg:basis-1/2 lg:border-b-0 lg:border-r lg:p-3"
          [class.max-lg:hidden]="activePanel() === 'cart'"
        >
          <div class="relative flex-shrink-0">
            <svg lucideSearch [size]="16" [strokeWidth]="2" aria-hidden="true" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></svg>
            <input
              id="txtBuscarDespacho"
              type="text"
              class="input pl-9"
              placeholder="Buscar en despacho..."
              aria-label="Buscar en despacho"
              [value]="filtros().texto"
              (input)="setTexto($any($event.target).value)"
            />
          </div>
          <div class="min-h-0 flex-1">
            <app-ubigeo-tree mode="dispatch" [groups]="grupos()" [loading]="loading()" />
          </div>
        </div>

        <div
          class="flex min-h-0 basis-full flex-col bg-white dark:bg-slate-900 lg:basis-1/2"
          [class.max-lg:hidden]="activePanel() === 'tree'"
        >
          <app-cart-panel />
        </div>
      </div>
    </div>
  `,
})
export class DespacharComponent {
  private readonly resources = inject(ResourcesService);
  private readonly filtrosSvc = inject(FiltrosService);
  private readonly estado = inject(EstadoService);

  readonly filtros = this.filtrosSvc.desp;

  readonly activePanel = signal<'tree' | 'cart'>('tree');

  readonly grupos = computed<UbigeoGroup[]>(() => {
    const prepared = this.estado.preparedItems();
    if (prepared.length === 0) return [];
    const iso = this.filtrosSvc.isoField(this.filtros().campoFecha);
    const filt = filtrarPedidos(prepared, this.filtros(), iso);
    return agruparPorUbigeo(filt, this.filtros().campoFecha);
  });

  readonly loading = computed(() => this.resources.pedidosAll.isLoading());
  readonly cartPedidoCount = this.estado.cartPedidoCount;

  setTexto(value: string): void {
    this.filtrosSvc.updateDesp({ texto: value });
  }
}
