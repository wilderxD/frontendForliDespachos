import { Pedido } from './pedido.model';

export interface UbigeoInfo {
  ubigeo: string;
  total: number;
}

export interface PedidosAll {
  ubigeos: UbigeoInfo[];
  byUbigeo: Record<string, Pedido[]>;
}

export interface GuardarPayload {
  chofer: string;
  placa: string;
  items: Pedido[];
}

export interface GuardarResult {
  id: string;
  fecha: string;
  chofer: string;
  placa: string;
  items: Pedido[];
}

export interface ActualizarResult {
  id: string;
  fecha: string;
  items: Pedido[];
}

export interface HistorialRecord {
  id: string;
  fecha: string;
  fechaFiltro: string;
  chofer: string;
  placa: string;
  cant: number;
  espumas: number;
  resortes: number;
  items: Pedido[];
}

export interface DispatchPrep {
  total: number;
  prepared: number;
  preparedPeds: string[];
  notPreparedPeds: string[];
}

export interface ProcessedEntry {
  pedido: string;
  ubigeo: string;
}
