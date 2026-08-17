import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { LucideTriangleAlert, LucideX } from '@lucide/angular';
import { ModalService } from './modal.service';

@Component({
  selector: 'app-modal-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideTriangleAlert, LucideX],
  template: `
    @if (state(); as s) {
      <div class="app-modal-backdrop absolute inset-0 flex items-center justify-center bg-black/50 p-4" style="animation:fadeIn 0.15s ease-out" (click)="onBackdrop($event)">
        <div
          class="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
          style="animation:fadeSlideIn 0.2s ease-out"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="s.title"
        >
          <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <h6 class="mb-0 flex items-center gap-1.5 text-sm font-bold">
              @if (s.kind === 'confirm') {
                <svg lucideTriangleAlert [size]="16" [strokeWidth]="2" aria-hidden="true" class="text-amber-500"></svg>
              }
              {{ s.title }}
            </h6>
            <button type="button" class="btn btn-ghost btn-icon-sm" aria-label="Cerrar" (click)="cancel()">
              <svg lucideX [size]="16" [strokeWidth]="2" aria-hidden="true"></svg>
            </button>
          </div>
          <div class="p-4">
            <p class="mb-0 text-center text-sm break-words">{{ s.text }}</p>
          </div>
          <div class="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
            @if (s.kind === 'confirm') {
              <button type="button" class="btn btn-outline btn-sm" (click)="cancel()">Cancelar</button>
              <button type="button" class="btn btn-sm" [class.btn-danger]="s.danger" [class.btn-primary]="!s.danger" (click)="accept()">
                {{ s.confirmLabel }}
              </button>
            } @else {
              <button type="button" class="btn btn-primary btn-sm ml-auto" (click)="cancel()">Cerrar</button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        z-index: 1055;
        pointer-events: none;
      }
      .app-modal-backdrop {
        pointer-events: auto;
      }
    `,
  ],
})
export class ModalHostComponent {
  private readonly service = inject(ModalService);
  readonly state = this.service.state;

  @HostListener('keydown.escape')
  onEscape(): void {
    this.service.dismiss();
  }

  onBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('app-modal-backdrop')) this.service.dismiss();
  }

  accept(): void {
    this.service.resolve(true);
  }

  cancel(): void {
    this.service.dismiss();
  }
}