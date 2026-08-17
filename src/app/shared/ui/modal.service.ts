import { Injectable, signal } from '@angular/core';

export interface ModalState {
  kind: 'confirm' | 'info';
  title: string;
  text: string;
  confirmLabel: string;
  danger: boolean;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  readonly state = signal<ModalState | null>(null);
  private resolver: ((v: boolean) => void) | null = null;

  confirm(title: string, text: string, options?: { confirmLabel?: string; danger?: boolean }): Promise<boolean> {
    this.state.set({
      kind: 'confirm',
      title,
      text,
      confirmLabel: options?.confirmLabel ?? 'Aceptar',
      danger: options?.danger ?? true,
    });
    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  info(title: string, text: string): void {
    this.state.set({ kind: 'info', title, text, confirmLabel: 'Cerrar', danger: false });
    this.resolver = null;
  }

  resolve(result: boolean): void {
    this.state.set(null);
    if (this.resolver) {
      this.resolver(result);
      this.resolver = null;
    }
  }

  dismiss(): void {
    this.state.set(null);
    if (this.resolver) {
      this.resolver(false);
      this.resolver = null;
    }
  }
}
