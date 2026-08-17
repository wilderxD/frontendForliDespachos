import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideChevronDown, LucideChevronRight, LucideCircleCheck, LucideClock, LucidePencil, LucidePrinter, LucideRefreshCw, LucideTrash2 } from '@lucide/angular';
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
  imports: [LucideChevronDown, LucideChevronRight, LucideCircleCheck, LucideClock, LucidePencil, LucidePrinter, LucideRefreshCw, LucideTrash2],
  template: `
    <div class="h-full overflow-auto p-3">
      <div class="card mb-3 flex flex-wrap items-center gap-2 p-2">
        <label class="text-sm font-bold" for="txtFechaHistorial">Filtrar por fecha:</label>
        <input
          type="date"
          id="txtFechaHistorial"
          class="input w-auto"
          [value]="resources.historialFecha()"
          (change)="setFecha($any($event.target).value)"
          autocomplete="off"
          aria-label="Filtrar historial por fecha"
        />
        <button type="button" class="btn btn-outline btn-sm" (click)="resources.refresh()">
          <svg lucideRefreshCw [size]="14" [strokeWidth]="2" aria-hidden="true"></svg> Recargar
        </button>
      </div>

      @if (historial.isLoading() || count.isLoading()) {
        <div class="card p-3">
          <div class="skeleton skeleton-block"></div>
          <div class="skeleton skeleton-block" style="height:36px"></div>
          <div class="skeleton skeleton-block" style="height:36px"></div>
        </div>
      } @else if (historial.error()) {
        <div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          Error al cargar historial
        </div>
      } @else {
        <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table class="table text-sm">
            <thead class="bg-slate-900 text-white dark:bg-slate-950">
              <tr>
                <th class="w-8"></th>
                <th>ID</th>
                <th>Fecha</th>
                <th>Chofer</th>
                <th>Placa</th>
                <th class="text-center">C.E.</th>
                <th class="text-center">C.R.</th>
                <th class="text-center">Prep.</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (r of registros(); track r.id) {
                <ng-container>
                  <tr class="cursor-pointer border-b border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50" (click)="toggleDetail(r.id)">
                    <td class="text-center">
                      @if (openDetails().has(r.id)) {
                        <svg lucideChevronDown [size]="14" [strokeWidth]="2" aria-hidden="true"></svg>
                      } @else {
                        <svg lucideChevronRight [size]="14" [strokeWidth]="2" aria-hidden="true"></svg>
                      }
                    </td>
                    <td class="font-mono">{{ r.id }}</td>
                    <td>{{ r.fecha.split(' ')[0] }}</td>
                    <td>{{ r.chofer.split(' ')[0] }}</td>
                    <td>{{ r.placa }}</td>
                    <td class="text-center font-bold text-violet-600 dark:text-violet-400">{{ r.espumas }}</td>
                    <td class="text-center font-bold text-cyan-600 dark:text-cyan-400">{{ r.resortes }}</td>
                    <td class="text-center">
                      @if (prepInfo(r); as info) {
                        <span class="font-bold">{{ info.prepared }}/{{ info.total }}</span>
                        @if (info.prepared === info.total) {
                          <span class="badge badge-success ml-1">✓</span>
                        } @else {
                          <span class="badge badge-amber ml-1">
                            {{ pctPrepared(info.prepared, info.total) }}%
                          </span>
                        }
                      } @else {
                        <span class="text-sm text-slate-400">-</span>
                      }
                    </td>
                    <td class="whitespace-nowrap">
                      <button type="button" class="btn btn-ghost btn-icon-sm" (click)="reimprimir(r)" title="Imprimir">
                        <svg lucidePrinter [size]="15" [strokeWidth]="2" aria-hidden="true"></svg>
                      </button>
                      <button type="button" class="btn btn-ghost btn-icon-sm" (click)="editar(r)" title="Editar">
                        <svg lucidePencil [size]="15" [strokeWidth]="2" aria-hidden="true" class="text-indigo-600 dark:text-indigo-400"></svg>
                      </button>
                      <button type="button" class="btn btn-ghost btn-icon-sm" (click)="eliminar(r)" title="Eliminar">
                        <svg lucideTrash2 [size]="15" [strokeWidth]="2" aria-hidden="true" class="text-red-600 dark:text-red-400"></svg>
                      </button>
                    </td>
                  </tr>
                  @if (openDetails().has(r.id)) {
                    <tr class="bg-slate-50 dark:bg-slate-800/50">
                      <td></td>
                      <td colspan="8" class="p-2">
                        @if (prepInfo(r); as info) {
                          @if (info.notPreparedPeds.length > 0) {
                            <div class="text-sm">
                              <span class="font-bold text-emerald-600 dark:text-emerald-400">✓ Preparados:</span>
                              {{ info.preparedPeds.length > 0 ? info.preparedPeds.join(', ') : 'ninguno' }}
                            </div>
                            <div class="mt-1 text-sm">
                              <span class="font-bold text-amber-600 dark:text-amber-400">— No preparados:</span> {{ info.notPreparedPeds.join(', ') }}
                            </div>
                          } @else {
                            <div class="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              <svg lucideCircleCheck [size]="14" [strokeWidth]="2" aria-hidden="true" class="inline"></svg> Todos los pedidos fueron preparados
                            </div>
                          }
                        }
                      </td>
                    </tr>
                  }
                </ng-container>
              } @empty {
                <tr>
                  <td colspan="9" class="py-4 text-center text-sm text-slate-500" role="status">
                    <svg lucideClock [size]="26" [strokeWidth]="1.5" aria-hidden="true" class="mx-auto mb-1 opacity-30"></svg>
                    No hay despachos para esta fecha
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (total() > 0) {
          <div class="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span class="text-slate-500">{{ total() }} registros — Pág. {{ resources.historialPage() }} de {{ totalPages() }}</span>
            <div class="flex items-center gap-1">
              <button type="button" class="btn btn-outline btn-sm" (click)="goTo(resources.historialPage() - 1)" [disabled]="resources.historialPage() <= 1">
                ‹ Anterior
              </button>
              @for (p of pages(); track p) {
                @if (p === -1) {
                  <button type="button" class="btn btn-outline btn-sm opacity-50" disabled>…</button>
                } @else {
                  <button type="button" class="btn btn-sm" [class.btn-primary]="p === resources.historialPage()" [class.btn-outline]="p !== resources.historialPage()" (click)="goTo(p)">
                    {{ p }}
                  </button>
                }
              }
              <button type="button" class="btn btn-outline btn-sm" (click)="goTo(resources.historialPage() + 1)" [disabled]="resources.historialPage() >= totalPages()">
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