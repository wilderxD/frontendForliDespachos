import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { LucideClipboardCheck, LucideClock, LucideMoon, LucideSun, LucideTruck } from '@lucide/angular';
import { ToastHostComponent } from './shared/ui/toast-host.component';
import { ModalHostComponent } from './shared/ui/modal-host.component';
import { EstadoService } from './core/state/estado.service';
import { ResourcesService } from './core/resources/resources.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ToastHostComponent,
    ModalHostComponent,
    LucideClipboardCheck,
    LucideClock,
    LucideMoon,
    LucideSun,
    LucideTruck,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly estado = inject(EstadoService);
  private readonly resources = inject(ResourcesService);
  private readonly router = inject(Router);

  readonly dark = signal(document.documentElement.getAttribute('data-theme') === 'dark');
  readonly preparedCount = this.estado.preparedCount;
  readonly histCount = computed(() => this.resources.historialCount.value() ?? 0);

  toggleTheme(): void {
    const next = !this.dark();
    this.dark.set(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    document.documentElement.style.colorScheme = next ? 'dark' : 'light';
    try {
      localStorage.setItem('forli_theme', next ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      e.preventDefault();
      const id = this.router.url.includes('despachar') ? 'txtBuscarDespacho' : 'txtBuscarPrep';
      setTimeout(() => document.getElementById(id)?.focus(), 50);
    }
  }
}