import { Injectable, signal } from '@angular/core';

export type CampoFecha = 'PEDIDOFECHA' | 'FECHAENTREGA';

export interface Filtros {
  texto: string;
  estados: string[];
  supervisores: string[];
  fechaDesde: string;
  fechaHasta: string;
  campoFecha: CampoFecha;
}

const defaultFiltros = (): Filtros => ({
  texto: '',
  estados: [],
  supervisores: [],
  fechaDesde: '',
  fechaHasta: '',
  campoFecha: 'PEDIDOFECHA',
});

@Injectable({ providedIn: 'root' })
export class FiltrosService {
  readonly prep = signal<Filtros>(defaultFiltros());
  readonly desp = signal<Filtros>(defaultFiltros());

  readonly reloadNonce = signal(0);

  constructor() {
    const cfPrep = localStorage.getItem('forli_campo_fecha_prep');
    if (cfPrep === 'FECHAENTREGA') this.prep.update((f) => ({ ...f, campoFecha: 'FECHAENTREGA' }));
    const cfDesp = localStorage.getItem('forli_campo_fecha_desp');
    if (cfDesp === 'FECHAENTREGA') this.desp.update((f) => ({ ...f, campoFecha: 'FECHAENTREGA' }));
  }

  updatePrep(patch: Partial<Filtros>): void {
    this.prep.update((f) => ({ ...f, ...patch }));
  }

  updateDesp(patch: Partial<Filtros>): void {
    this.desp.update((f) => ({ ...f, ...patch }));
  }

  setCampoFechaPrep(campo: CampoFecha): void {
    this.updatePrep({ campoFecha: campo });
    localStorage.setItem('forli_campo_fecha_prep', campo);
  }

  setCampoFechaDesp(campo: CampoFecha): void {
    this.updateDesp({ campoFecha: campo });
    localStorage.setItem('forli_campo_fecha_desp', campo);
  }

  resetPrep(): void {
    this.prep.set(defaultFiltros());
  }

  resetDesp(): void {
    this.desp.set(defaultFiltros());
  }

  isoField(campo: CampoFecha): 'fechaISO' | 'fechaEntregaISO' {
    return campo === 'FECHAENTREGA' ? 'fechaEntregaISO' : 'fechaISO';
  }
}
