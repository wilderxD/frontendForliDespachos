export interface Pedido {
  idUnico: number;
  pedido: string;
  cliente: string;
  producto: string;
  cantidad: number;
  supervisor: string;
  estado: string;
  ubigeo: string;
  agencia: string;
  direccion: string;
  codigoVenta: string;
  linea: string;
  observacion: string;
  fecha: string;
  fechaISO: string;
  fechaEntrega: string;
  fechaEntregaISO: string;
}
