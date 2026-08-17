import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { ModalService } from './modal.service';

@Component({
  selector: 'app-modal-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    @if (state(); as s) {
      <div class="app-modal-backdrop" (click)="onBackdrop($event)">
        <div class="app-modal" role="dialog" aria-modal="true" [attr.aria-label]="s.title">
          <div class="app-modal-header">
            <h6 class="fw-bold mb-0">
              @if (s.kind === 'confirm') {
                <i class="bi bi-exclamation-triangle me-1"></i>
              }
              {{ s.title }}
            </h6>
            <button type="button" class="btn-close" aria-label="Cerrar" (click)="cancel()"></button>
          </div>
          <div class="app-modal-body">
            <p class="small text-center mb-0 text-break">{{ s.text }}</p>
          </div>
          <div class="app-modal-footer">
            @if (s.kind === 'confirm') {
              <button type="button" class="btn btn-sm btn-secondary" (click)="cancel()">Cancelar</button>
              <button type="button" class="btn btn-sm" [class.btn-danger]="s.danger" [class.btn-primary]="!s.danger" (click)="accept()">
                {{ s.confirmLabel }}
              </button>
            } @else {
              <button type="button" class="btn btn-sm btn-primary ms-auto" (click)="cancel()">Cerrar</button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host { position: fixed; inset: 0; z-index: 1055; pointer-events: none; }
      .app-modal-backdrop {
        position: absolute; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex;
        align-items: center; justify-content: center; pointer-events: auto; animation: fadeIn 0.15s ease-out;
      }
      .app-modal {
        background: var(--color-card); color: var(--color-card-foreground); border: 1px solid var(--color-border);
        border-radius: 8px; width: min(420px, 92vw); box-shadow: var(--shadow-md); animation: fadeSlideIn 0.2s ease-out;
        overflow: hidden;
      }
      .app-modal-header {
        display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem;
        border-bottom: 1px solid var(--color-border);
      }
      .app-modal-body { padding: 1rem; }
      .app-modal-footer {
        display: flex; justify-content: flex-end; gap: 0.5rem; padding: 0.5rem 1rem;
        border-top: 1px solid var(--color-border);
      }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
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
