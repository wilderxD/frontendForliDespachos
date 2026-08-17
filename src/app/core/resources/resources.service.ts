import { Injectable, resource, signal } from '@angular/core';
import { ApiService } from '../api/api.service';
import { MetaData } from '../models/meta.model';
import { HistorialRecord, PedidosAll } from '../models/despacho.model';
import { FiltrosService } from '../state/filtros.service';

const PAGE_SIZE = 50;

@Injectable({ providedIn: 'root' })
export class ResourcesService {
  private readonly reload = signal(0);
  readonly lastUpdated = signal<Date | null>(null);

  readonly meta = resource({
    loader: () => {
      this.lastUpdated.set(new Date());
      return this.api.get<MetaData>('meta');
    },
  });

  readonly pedidosAll = resource({
    params: () => this.reload(),
    loader: ({ params }) => {
      void params;
      this.lastUpdated.set(new Date());
      return this.api.get<PedidosAll>('pedidos_all');
    },
  });

  readonly historialPage = signal(1);
  readonly historialFecha = signal(todayISO());

  readonly historial = resource({
    params: () => ({ page: this.historialPage(), fecha: this.historialFecha(), nonce: this.reload() }),
    loader: ({ params }) =>
      this.api.get<HistorialRecord[]>('historial', { fecha: params.fecha, page: params.page, pageSize: PAGE_SIZE }),
  });

  readonly historialCount = resource({
    params: () => ({ fecha: this.historialFecha(), nonce: this.reload() }),
    loader: ({ params }) => this.api.get<number>('historial_count', { fecha: params.fecha }),
  });

  readonly pageSize = PAGE_SIZE;

  constructor(
    private readonly api: ApiService,
    private readonly filtros: FiltrosService,
  ) {
    void this.filtros;
  }

  refresh(): void {
    this.reload.update((n) => n + 1);
  }
}

function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
