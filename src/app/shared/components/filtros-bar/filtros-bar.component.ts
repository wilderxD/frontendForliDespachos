import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FiltrosService, CampoFecha } from '../../../core/state/filtros.service';
import { ResourcesService } from '../../../core/resources/resources.service';

@Component({
  selector: 'app-filtros-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="bg-card px-3 py-2 border-bottom shadow-sm">
      <div class="row g-2 align-items-center">
        <div class="col-6 col-sm-3">
          <input
            type="date"
            class="form-control form-control-sm"
            [value]="filtros().fechaDesde"
            (change)="setFiltros({ fechaDesde: $any($event.target).value })"
            title="Fecha desde"
            autocomplete="off"
            aria-label="Fecha desde"
          />
        </div>
        <div class="col-6 col-sm-3">
          <input
            type="date"
            class="form-control form-control-sm"
            [value]="filtros().fechaHasta"
            (change)="setFiltros({ fechaHasta: $any($event.target).value })"
            title="Fecha hasta"
            autocomplete="off"
            aria-label="Fecha hasta"
          />
        </div>
        <div class="col-12 col-sm-6">
          <div class="btn-group btn-group-sm w-100" role="group" aria-label="Campo de fecha">
            <button
              type="button"
              class="btn btn-outline-secondary"
              [class.active]="filtros().campoFecha === 'PEDIDOFECHA'"
              (click)="setCampo('PEDIDOFECHA')"
            >
              F.Pedido
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              [class.active]="filtros().campoFecha === 'FECHAENTREGA'"
              (click)="setCampo('FECHAENTREGA')"
            >
              F.Entrega
            </button>
          </div>
        </div>
        <div class="col-6">
          <div class="dropdown">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary dropdown-toggle w-100 text-truncate"
              (click)="toggleSup()"
              [attr.aria-expanded]="openSup()"
            >
              <i class="bi bi-people me-1"></i>Supervisores
              @if (supCount() > 0) {
                <span class="badge bg-primary ms-1" style="font-size:0.6rem">{{ supCount() }}</span>
              }
            </button>
            @if (openSup()) {
              <div class="dropdown-menu show p-2">
                <div class="dropdown-check-list w-100">
                  @for (s of supervisores(); track s) {
                    <div class="form-check">
                      <input
                        class="form-check-input chk-sup"
                        type="checkbox"
                        [checked]="filtros().supervisores.includes(s)"
                        (change)="toggleSupValue(s, $any($event.target).checked)"
                      />
                      <label class="form-check-label small text-truncate">{{ s }}</label>
                    </div>
                  } @empty {
                    <small class="text-muted">Sin datos</small>
                  }
                </div>
                <div class="p-2 border-top text-end">
                  <button type="button" class="btn btn-xs btn-primary" (click)="openSup.set(false)">Aplicar</button>
                </div>
              </div>
            }
          </div>
        </div>
        <div class="col-6">
          <div class="dropdown">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary dropdown-toggle w-100 text-truncate"
              (click)="toggleEst()"
              [attr.aria-expanded]="openEst()"
            >
              <i class="bi bi-tag me-1"></i>Estados
              @if (estCount() > 0) {
                <span class="badge bg-primary ms-1" style="font-size:0.6rem">{{ estCount() }}</span>
              }
            </button>
            @if (openEst()) {
              <div class="dropdown-menu show p-2">
                <div class="dropdown-check-list w-100">
                  @for (e of estados(); track e) {
                    <div class="form-check">
                      <input
                        class="form-check-input chk-estado"
                        type="checkbox"
                        [checked]="filtros().estados.includes(e)"
                        (change)="toggleEstValue(e, $any($event.target).checked)"
                      />
                      <label class="form-check-label small text-truncate">{{ e }}</label>
                    </div>
                  } @empty {
                    <small class="text-muted">Sin datos</small>
                  }
                </div>
                <div class="p-2 border-top text-end">
                  <button type="button" class="btn btn-xs btn-primary" (click)="openEst.set(false)">Aplicar</button>
                </div>
              </div>
            }
          </div>
        </div>
        <div class="col-12 text-end d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-sm btn-link text-muted p-0 text-xs" (click)="limpiar()">
            Limpiar Filtros <i class="bi bi-x-lg"></i>
          </button>
          <button type="button" class="btn btn-sm btn-link p-0 text-xs text-primary fw-bold" (click)="recargar()">
            <i class="bi bi-arrow-clockwise"></i> Recargar
          </button>
        </div>
      </div>
    </div>
  `,
})
export class FiltrosBarComponent {
  readonly tab = input<'prep' | 'desp'>('prep');

  readonly filtrosSvc = inject(FiltrosService);
  private readonly resources = inject(ResourcesService);

  readonly openSup = signal(false);
  readonly openEst = signal(false);

  readonly filtros = computed(() => (this.tab() === 'prep' ? this.filtrosSvc.prep() : this.filtrosSvc.desp()));

  readonly supervisores = computed(() => this.resources.meta.value()?.supervisores ?? []);
  readonly estados = computed(() => this.resources.meta.value()?.estados ?? []);

  readonly supCount = computed(() => Math.max(0, this.supervisores().length - this.filtros().supervisores.length));
  readonly estCount = computed(() => Math.max(0, this.estados().length - this.filtros().estados.length));

  setFiltros(patch: { fechaDesde?: string; fechaHasta?: string }): void {
    if (this.tab() === 'prep') this.filtrosSvc.updatePrep(patch);
    else this.filtrosSvc.updateDesp(patch);
  }

  setCampo(campo: CampoFecha): void {
    if (this.tab() === 'prep') this.filtrosSvc.setCampoFechaPrep(campo);
    else this.filtrosSvc.setCampoFechaDesp(campo);
  }

  toggleSup(): void {
    this.openSup.update((v) => !v);
    this.openEst.set(false);
  }

  toggleEst(): void {
    this.openEst.update((v) => !v);
    this.openSup.set(false);
  }

  toggleSupValue(value: string, checked: boolean): void {
    const current = this.filtros().supervisores;
    const next = checked ? [...current, value] : current.filter((v) => v !== value);
    if (this.tab() === 'prep') this.filtrosSvc.updatePrep({ supervisores: next });
    else this.filtrosSvc.updateDesp({ supervisores: next });
  }

  toggleEstValue(value: string, checked: boolean): void {
    const current = this.filtros().estados;
    const next = checked ? [...current, value] : current.filter((v) => v !== value);
    if (this.tab() === 'prep') this.filtrosSvc.updatePrep({ estados: next });
    else this.filtrosSvc.updateDesp({ estados: next });
  }

  limpiar(): void {
    if (this.tab() === 'prep') this.filtrosSvc.resetPrep();
    else this.filtrosSvc.resetDesp();
  }

  recargar(): void {
    this.resources.refresh();
  }
}
