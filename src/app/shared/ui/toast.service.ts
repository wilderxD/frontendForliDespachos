import { Injectable, signal } from '@angular/core';

export interface ToastAction {
  label: string;
  fn: () => void;
}

export interface ToastMsg {
  id: number;
  text: string;
  type: 'success' | 'danger' | 'warning';
  action?: ToastAction;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastMsg[]>([]);
  private nextId = 1;

  show(text: string, type: ToastMsg['type'] = 'success', action?: ToastAction): void {
    const id = this.nextId++;
    const msg: ToastMsg = { id, text, type, action };
    this.toasts.update((list) => [...list, msg]);
    if (!action) {
      setTimeout(() => this.dismiss(id), 4000);
    }
  }

  showError(text: string, retry?: () => void): void {
    this.show(text, 'danger', retry ? { label: 'Reintentar', fn: retry } : undefined);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
