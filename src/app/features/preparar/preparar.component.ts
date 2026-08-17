import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FiltrosBarComponent } from '../../shared/components/filtros-bar/filtros-bar.component';
import { UbigeoTreeComponent } from '../../shared/components/ubigeo-tree/ubigeo-tree.component';
import { ResourcesService } from '../../core/resources/resources.service';
import { FiltrosService } from '../../core/state/filtros.service';
import { EstadoService } from '../../core/state/estado.service';
import { agruparPorUbigeo, filtrarPedidos } from '../../shared/utils/pedido-utils';

@Component({
  selector: 'app-preparar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FiltrosBarComponent, UbigeoTreeComponent, DatePipe],
  template: `
    <div class="d-flex flex-column h-100 min-h-0">
      <app-filtros-bar tab="prep" />

      <div class="p-3 h-100 d-flex flex-column" style="overflow:hidden">
        <div class="input-group input-group-sm mb-2 flex-shrink-0">
          <span class="input-group-text bg-card"><i class="bi bi-search"></i></span>
          <input
            id="txtBuscarPrep"
            type="text"
            class="form-control"
            placeholder="Buscar Cliente, Pedido..."
            aria-label="Buscar Cliente o Pedido"
            [value]="filtros().texto"
            (input)="setTexto($any($event.target).value)"
          />
        </div>

        <div class="d-flex justify-content-between align-items-center flex-shrink-0 mb-2 touch-gap">
          <div class="d-flex align-items-center touch-gap-sm">
            <small class="text-muted-fg fw-semibold text-nowrap">{{ prepared() }} / {{ total() }} preparados</small>
            @if (lastUpdated(); as ts) {
              <small class="text-muted text-xs" style="white-space:nowrap">· {{ ts | date: 'HH:mm' }}</small>
            }
          </div>
          <button type="button" class="btn btn-sm btn-primary fw-bold text-nowrap" (click)="irADespachar()">
            <i class="bi bi-arrow-right"></i> Ir a Despachar
          </button>
        </div>

        <div class="flex-grow-1 min-h-0">
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
    return agruparPorUbigeo(filt);
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