import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div
      class="toast-container position-fixed bottom-0 end-0 p-3"
      style="z-index: 9999"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      @for (t of toasts(); track t.id) {
        <div class="toast show align-items-center border-0 text-bg-{{ t.type }} mb-2" role="alert">
          <div class="d-flex">
            <div class="toast-body">
              {{ t.text }}
              @if (t.action) {
                <button type="button" class="btn btn-sm btn-light ms-2 py-0 px-2" (click)="runAction(t.id)">
                  {{ t.action.label }}
                </button>
              }
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" (click)="dismiss(t.id)" aria-label="Cerrar"></button>
          </div>
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
