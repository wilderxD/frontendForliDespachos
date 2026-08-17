import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { LucideArrowRight, LucideSearch } from '@lucide/angular';
import { FiltrosBarComponent } from '../../shared/components/filtros-bar/filtros-bar.component';
import { UbigeoTreeComponent } from '../../shared/components/ubigeo-tree/ubigeo-tree.component';
import { ResourcesService } from '../../core/resources/resources.service';
import { FiltrosService } from '../../core/state/filtros.service';
import { EstadoService } from '../../core/state/estado.service';
import { agruparPorUbigeo, filtrarPedidos } from '../../shared/utils/pedido-utils';

@Component({
  selector: 'app-preparar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FiltrosBarComponent, UbigeoTreeComponent, DatePipe, LucideArrowRight, LucideSearch],
  template: `
    <div class="flex h-full min-h-0 flex-col">
      <app-filtros-bar tab="prep" />

      <div class="flex h-full flex-col overflow-hidden p-3">
        <div class="relative mb-2 flex-shrink-0">
          <svg lucideSearch [size]="16" [strokeWidth]="2" aria-hidden="true" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></svg>
          <input
            id="txtBuscarPrep"
            type="text"
            class="input pl-9"
            placeholder="Buscar Cliente, Pedido..."
            aria-label="Buscar Cliente o Pedido"
            [value]="filtros().texto"
            (input)="setTexto($any($event.target).value)"
          />
        </div>

        <div class="mb-2 flex flex-shrink-0 items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <small class="whitespace-nowrap font-semibold text-slate-600 dark:text-slate-300">{{ prepared() }} / {{ total() }} preparados</small>
            @if (lastUpdated(); as ts) {
              <small class="whitespace-nowrap text-xs text-slate-400">· {{ ts | date: 'HH:mm' }}</small>
            }
          </div>
          <button type="button" class="btn btn-primary whitespace-nowrap" (click)="irADespachar()">
            Ir a Despachar <svg lucideArrowRight [size]="15" [strokeWidth]="2" aria-hidden="true"></svg>
          </button>
        </div>

        <div class="min-h-0 flex-1">
          <app-ubigeo-tree mode="prepare" [groups]="grupos()" [loading]="loading()" />
        </div>
      </div>
    </div>
  `,
})
export class PrepararComponent {
  private readonly resources = inject(ResourcesService);
  private readonly filtrosSvc = inject(FiltrosService);
  private readonly estado = inject(EstadoService);
  private readonly router = inject(Router);

  readonly filtros = this.filtrosSvc.prep;

  readonly grupos = computed(() => {
    const all = this.resources.pedidosAll.value();
    if (!all) return [];
    const flat = Object.values(all.byUbigeo).flat();
    const iso = this.filtrosSvc.isoField(this.filtros().campoFecha);
    const filt = filtrarPedidos(flat, this.filtros(), iso).filter((p) => !this.estado.isProcessed(p.pedido));
    return agruparPorUbigeo(filt, this.filtros().campoFecha);
  });

  readonly loading = computed(() => this.resources.pedidosAll.isLoading());
  readonly total = computed(() => this.resources.meta.value()?.totalPedidos ?? 0);
  readonly prepared = this.estado.preparedCount;
  readonly lastUpdated = this.resources.lastUpdated;

  setTexto(value: string): void {
    this.filtrosSvc.updatePrep({ texto: value });
  }

  irADespachar(): void {
    this.router.navigate(['/despachar']);
  }
}