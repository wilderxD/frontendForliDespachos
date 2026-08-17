import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ResourcesService } from '../../core/resources/resources.service';
import { EstadoService } from '../../core/state/estado.service';
import { ApiService } from '../../core/api/api.service';
import { PrintService } from '../../core/services/print.service';
import { ModalService } from '../../shared/ui/modal.service';
import { ToastService } from '../../shared/ui/toast.service';
import { HistorialRecord } from '../../core/models/despacho.model';
import { ApiError } from '../../core/api/api-error';

@Component({
  selector: 'app-historial',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="p-3 h-100 overflow-auto">
      <div class="card mb-3 p-2 bg-light border-0 shadow-sm">
        <div class="row g-2 align-items-center">
          <div class="col-auto">
            <label class="fw-bold small" for="txtFechaHistorial">Filtrar por fecha:</label>
          </div>
          <div class="col-auto">
            <input
              type="date"
              id="txtFechaHistorial"
              class="form-control form-control-sm"
              [value]="resources.historialFecha()"
              (change)="setFecha($any($event.target).value)"
              autocomplete="off"
              aria-label="Filtrar historial por fecha"
            />
          </div>
          <div class="col text-end">
            <button type="button" class="btn btn-sm btn-outline-primary" (click)="resources.refresh()">
              <i class="bi bi-arrow-clockwise"></i> Recargar
            </button>
          </div>
        </div>
      </div>

      @if (historial.isLoading() || count.isLoading()) {
        <div class="card p-3 bg-card border-card">
          <div class="skeleton skeleton-block"></div>
          <div class="skeleton skeleton-block" style="height:36px"></div>
          <div class="skeleton skeleton-block" style="height:36px"></div>
        </div>
      } @else if (historial.error()) {
        <div class="alert alert-danger small">Error al cargar historial</div>
      } @else {
        <div class="table-responsive">
          <table class="table table-sm table-striped table-hover bg-card border text-small">
            <thead class="table-dark">
              <tr>
                <th style="width:32px"></th>
                <th>ID</th>
                <th>Fecha</th>
                <th>Chofer</th>
                <th>Placa</th>
                <th>C.E.</th>
                <th>C.R.</th>
                <th>Prep.</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (r of registros(); track r.id) {
                <ng-container>
                  <tr class="hist-main-row cursor-pointer" (click)="toggleDetail(r.id)">
                    <td class="text-center hist-toggle-icon">
                      <i class="bi" [class.bi-chevron-right]="!openDetails().has(r.id)" [class.bi-chevron-down]="openDetails().has(r.id)" style="font-size:0.7rem"></i>
                    </td>
                    <td class="font-mono">{{ r.id }}</td>
                    <td>{{ r.fecha.split(' ')[0] }}</td>
                    <td>{{ r.chofer.split(' ')[0] }}</td>
                    <td>{{ r.placa }}</td>
                    <td class="text-center fw-bold text-espuma">{{ r.espumas }}</td>
                    <td class="text-center fw-bold text-resorte">{{ r.resortes }}</td>
                    <td class="text-center">
                      @if (prepInfo(r); as info) {
                        <span class="fw-bold">{{ info.prepared }}/{{ info.total }}</span>
                        @if (info.prepared === info.total) {
                          <span class="badge bg-success ms-1" style="font-size:0.55rem">✓</span>
                        } @else {
                          <span class="badge bg-warning text-dark ms-1" style="font-size:0.55rem">
                            {{ pctPrepared(info.prepared, info.total) }}%
                          </span>
                        }
                      } @else {
                        <span class="text-muted small">-</span>
                      }
                    </td>
                    <td class="text-nowrap">
                      <button type="button" class="btn btn-sm btn-outline-dark py-0" (click)="reimprimir(r)" title="Imprimir">
                        <i class="bi bi-printer"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-outline-primary py-0" (click)="editar(r)" title="Editar">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-outline-danger py-0" (click)="eliminar(r)" title="Eliminar">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                  @if (openDetails().has(r.id)) {
                    <tr class="hist-detail-row">
                      <td colspan="9" class="p-2 bg-light">
                        @if (prepInfo(r); as info) {
                          @if (info.notPreparedPeds.length > 0) {
                            <div class="small">
                              <span class="fw-bold text-success">✓ Preparados:</span>
                              {{ info.preparedPeds.length > 0 ? info.preparedPeds.join(', ') : 'ninguno' }}
                            </div>
                            <div class="small mt-1">
                              <span class="fw-bold text-warning">— No preparados:</span> {{ info.notPreparedPeds.join(', ') }}
                            </div>
                          } @else {
                            <div class="small text-success fw-bold">
                              <i class="bi bi-check-circle-fill"></i> Todos los pedidos fueron preparados
                            </div>
                          }
                        }
                      </td>
                    </tr>
                  }
                </ng-container>
              } @empty {
                <tr>
                  <td colspan="9" class="text-center py-4 text-muted" role="status">
                    <i class="bi bi-clock-history empty-icon-sm" aria-hidden="true"></i>No hay despachos para esta fecha
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (total() > 0) {
          <div class="d-flex justify-content-between align-items-center small mt-1 flex-wrap gap-2">
            <span class="text-muted">{{ total() }} registros — Pág. {{ resources.historialPage() }} de {{ totalPages() }}</span>
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-secondary" (click)="goTo(resources.historialPage() - 1)" [disabled]="resources.historialPage() <= 1">
                ‹ Anterior
              </button>
              @for (p of pages(); track p) {
                @if (p === -1) {
                  <button type="button" class="btn btn-outline-secondary disabled">…</button>
                } @else {
                  <button type="button" class="btn btn-outline-secondary" [class.active]="p === resources.historialPage()" (click)="goTo(p)">
                    {{ p }}
                  </button>
                }
              }
              <button type="button" class="btn btn-outline-secondary" (click)="goTo(resources.historialPage() + 1)" [disabled]="resources.historialPage() >= totalPages()">
                Siguiente ›
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class HistorialComponent {
  readonly resources = inject(ResourcesService);
  private readonly estado = inject(EstadoService);
  private readonly api = inject(ApiService);
  private readonly print = inject(PrintService);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly historial = this.resources.historial;
  readonly count = this.resources.historialCount;
  readonly openDetails = signal<Set<string>>(new Set());

  readonly registros = computed(() => this.historial.value() ?? []);

  readonly total = computed(() => this.count.value() ?? 0);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.resources.pageSize)));

  readonly pages = computed(() => {
    const current = this.resources.historialPage();
    const last = this.totalPages();
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(last, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    const out: number[] = [];
    if (start > 1) {
      out.push(1);
      if (start > 2) out.push(-1);
    }
    for (let i = start; i <= end; i++) out.push(i);
    if (end < last) {
      if (end < last - 1) out.push(-1);
      out.push(last);
    }
    return out;
  });

  setFecha(value: string): void {
    this.resources.historialFecha.set(value);
    this.resources.historialPage.set(1);
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.resources.historialPage.set(page);
  }

  toggleDetail(id: string): void {
    this.openDetails.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  prepInfo(r: HistorialRecord): { prepared: number; total: number; preparedPeds: string[]; notPreparedPeds: string[] } | undefined {
    return this.estado.dispatchPrepared()[r.id];
  }

  pctPrepared(prepared: number, total: number): number {
    return total > 0 ? Math.round((prepared / total) * 100) : 0;
  }

  reimprimir(r: HistorialRecord): void {
    this.print.reimprimir(r);
  }

  editar(r: HistorialRecord): void {
    this.modal
      .confirm('Cargar al Carrito', `¿Cargar los items del despacho ${r.id} al carrito?`, { confirmLabel: 'Cargar', danger: false })
      .then((ok) => {
        if (!ok) return;
        this.estado.loadToCart(r.items);
        this.estado.chofer.set(r.chofer);
        this.estado.placa.set(r.placa);
        this.router.navigate(['/despachar']);
        this.toast.show('Despacho ' + r.id + ' cargado al carrito');
      });
  }

  eliminar(r: HistorialRecord): void {
    this.modal.confirm('Eliminar Despacho', `¿Seguro que deseas eliminar el despacho ${r.id}?`).then((ok) => {
      if (!ok) return;
      this.api
        .post<boolean>('eliminar', { id: r.id })
        .then(() => {
          this.estado.removeDispatchPrepared(r.id);
          this.resources.refresh();
          this.toast.show('Despacho ' + r.id + ' eliminado');
        })
        .catch((err: unknown) => {
          const message = err instanceof ApiError ? err.message : 'Error al eliminar';
          this.toast.showError('Error: ' + message);
        });
    });
  }
}