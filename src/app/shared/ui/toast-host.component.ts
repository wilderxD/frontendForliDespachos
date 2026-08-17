import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideX } from '@lucide/angular';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideX],
  template: `
    <div class="fixed bottom-0 right-0 z-[9999] flex flex-col gap-2 p-3" role="status" aria-live="polite" aria-atomic="true">
      @for (t of toasts(); track t.id) {
        <div
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm shadow-lg"
          role="alert"
          [class.bg-emerald-600]="t.type === 'success'"
          [class.text-white]="t.type !== 'warning'"
          [class.bg-red-600]="t.type === 'danger'"
          [class.bg-amber-500]="t.type === 'warning'"
          [class.text-amber-950]="t.type === 'warning'"
          style="animation:fadeSlideIn 0.2s ease-out"
        >
          <div class="min-w-0 flex-1">
            {{ t.text }}
            @if (t.action) {
              <button type="button" class="btn ml-2 bg-white/20 px-2 py-0 text-xs font-bold hover:bg-white/30" (click)="runAction(t.id)">
                {{ t.action.label }}
              </button>
            }
          </div>
          <button type="button" class="btn btn-ghost btn-icon-sm shrink-0" (click)="dismiss(t.id)" aria-label="Cerrar">
            <svg lucideX [size]="15" [strokeWidth]="2" aria-hidden="true"></svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHostComponent {
  private readonly service = inject(ToastService);
  readonly toasts = this.service.toasts;

  dismiss(id: number): void {
    this.service.dismiss(id);
  }

  runAction(id: number): void {
    const t = this.service.toasts().find((x) => x.id === id);
    if (t?.action) {
      t.action.fn();
      this.service.dismiss(id);
    }
  }
}