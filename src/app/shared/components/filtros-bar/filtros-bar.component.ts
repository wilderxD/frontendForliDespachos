import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { LucideChevronDown, LucideRefreshCw, LucideTag, LucideUsers, LucideX } from '@lucide/angular';
import { FiltrosService, CampoFecha, LineaFilter } from '../../../core/state/filtros.service';
import { ResourcesService } from '../../../core/resources/resources.service';

@Component({
  selector: 'app-filtros-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideChevronDown, LucideRefreshCw, LucideTag, LucideUsers, LucideX],
  template: `
    <div class="border-b border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="grid grid-cols-2 items-end gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <div class="col-span-1">
          <input
            type="date"
            class="input"
            [value]="filtros().fechaDesde"
            (change)="setFiltros({ fechaDesde: $any($event.target).value })"
            title="Fecha desde"
            autocomplete="off"
            aria-label="Fecha desde"
          />
        </div>
        <div class="col-span-1">
          <input
            type="date"
            class="input"
            [value]="filtros().fechaHasta"
            (change)="setFiltros({ fechaHasta: $any($event.target).value })"
            title="Fecha hasta"
            autocomplete="off"
            aria-label="Fecha hasta"
          />
        </div>
        <div class="col-span-2 sm:col-span-1">
          <div class="inline-flex w-full overflow-hidden rounded-lg border border-slate-300 bg-white text-xs font-semibold dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              class="h-9 flex-1 px-2 transition-colors"
              [class.bg-indigo-600]="filtros().campoFecha === 'PEDIDOFECHA'"
              [class.text-white]="filtros().campoFecha === 'PEDIDOFECHA'"
              [class.text-slate-600]="filtros().campoFecha !== 'PEDIDOFECHA'"
              [class.dark:text-slate-300]="filtros().campoFecha !== 'PEDIDOFECHA'"
              (click)="setCampo('PEDIDOFECHA')"
            >
              F.Pedido
            </button>
            <div class="w-px bg-slate-300 dark:bg-slate-700"></div>
            <button
              type="button"
              class="h-9 flex-1 px-2 transition-colors"
              [class.bg-indigo-600]="filtros().campoFecha === 'FECHAENTREGA'"
              [class.text-white]="filtros().campoFecha === 'FECHAENTREGA'"
              [class.text-slate-600]="filtros().campoFecha !== 'FECHAENTREGA'"
              [class.dark:text-slate-300]="filtros().campoFecha !== 'FECHAENTREGA'"
              (click)="setCampo('FECHAENTREGA')"
            >
              F.Entrega
            </button>
          </div>
        </div>
        <div class="relative col-span-1">
          <select
            class="select"
            [value]="filtros().linea"
            (change)="setFiltros({ linea: $any($event.target).value })"
            aria-label="Filtrar por tipo de colchón"
            title="Filtrar por tipo de colchón"
          >
            <option value="">Todos</option>
            <option value="RESORTE">C.R. (Resorte)</option>
            <option value="ESPUMA">C. Espuma</option>
          </select>
        </div>
        <div class="relative col-span-1">
          <button
            type="button"
            class="btn btn-outline w-full justify-between"
            (click)="toggleSup()"
            [attr.aria-expanded]="openSup()"
          >
            <span class="flex min-w-0 items-center gap-1.5">
              <svg lucideUsers [size]="15" [strokeWidth]="2" aria-hidden="true"></svg>
              <span class="truncate">Supervisores</span>
              @if (supCount() > 0) {
                <span class="badge badge-primary ml-1">{{ supCount() }}</span>
              }
            </span>
            <svg lucideChevronDown [size]="14" [strokeWidth]="2" aria-hidden="true" [class.rotate-180]="openSup()" class="transition-transform"></svg>
          </button>
          @if (openSup()) {
            <div class="dropdown-panel">
              <div class="max-h-56 overflow-y-auto p-2">
                @for (s of supervisores(); track s) {
                  <label class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                    <input
                      class="h-4 w-4 shrink-0 accent-indigo-600"
                      type="checkbox"
                      [checked]="filtros().supervisores.includes(s)"
                      (change)="toggleSupValue(s, $any($event.target).checked)"
                    />
                    <span class="truncate">{{ s }}</span>
                  </label>
                } @empty {
                  <small class="px-2 text-slate-500">Sin datos</small>
                }
              </div>
              <div class="flex justify-end border-t border-slate-200 p-2 dark:border-slate-700">
                <button type="button" class="btn btn-primary btn-xs" (click)="openSup.set(false)">Aplicar</button>
              </div>
            </div>
          }
        </div>
        <div class="relative col-span-1">
          <button
            type="button"
            class="btn btn-outline w-full justify-between"
            (click)="toggleEst()"
            [attr.aria-expanded]="openEst()"
          >
            <span class="flex min-w-0 items-center gap-1.5">
              <svg lucideTag [size]="15" [strokeWidth]="2" aria-hidden="true"></svg>
              <span class="truncate">Estados</span>
              @if (estCount() > 0) {
                <span class="badge badge-primary ml-1">{{ estCount() }}</span>
              }
            </span>
            <svg lucideChevronDown [size]="14" [strokeWidth]="2" aria-hidden="true" [class.rotate-180]="openEst()" class="transition-transform"></svg>
          </button>
          @if (openEst()) {
            <div class="dropdown-panel">
              <div class="max-h-56 overflow-y-auto p-2">
                @for (e of estados(); track e) {
                  <label class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                    <input
                      class="h-4 w-4 shrink-0 accent-indigo-600"
                      type="checkbox"
                      [checked]="filtros().estados.includes(e)"
                      (change)="toggleEstValue(e, $any($event.target).checked)"
                    />
                    <span class="truncate">{{ e }}</span>
                  </label>
                } @empty {
                  <small class="px-2 text-slate-500">Sin datos</small>
                }
              </div>
              <div class="flex justify-end border-t border-slate-200 p-2 dark:border-slate-700">
                <button type="button" class="btn btn-primary btn-xs" (click)="openEst.set(false)">Aplicar</button>
              </div>
            </div>
          }
        </div>
        <div class="col-span-2 flex justify-end gap-2 sm:col-span-3 xl:col-span-6">
          <button type="button" class="btn btn-ghost btn-xs p-0 text-slate-500" (click)="limpiar()">
            Limpiar Filtros <svg lucideX [size]="12" [strokeWidth]="2" aria-hidden="true"></svg>
          </button>
          <button type="button" class="btn btn-ghost btn-xs p-0 font-bold text-indigo-600 dark:text-indigo-400" (click)="recargar()">
            <svg lucideRefreshCw [size]="13" [strokeWidth]="2" aria-hidden="true"></svg> Recargar
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

  setFiltros(patch: { fechaDesde?: string; fechaHasta?: string; linea?: LineaFilter }): void {
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