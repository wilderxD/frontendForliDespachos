import { Pedido } from '../../core/models/pedido.model';
import { CampoFecha, Filtros } from '../../core/state/filtros.service';

export interface PedidoItems {
  pedido: string;
  items: Pedido[];
}

export interface ClienteGroup {
  cliente: string;
  agencia: string;
  pedidos: PedidoItems[];
  total: number;
}

export interface AgenciaGroup {
  agencia: string;
  clientes: ClienteGroup[];
  total: number;
}

export interface UbigeoGroup {
  ubigeo: string;
  total: number;
  agencias: AgenciaGroup[];
}

export function aplicaFiltros(p: Pedido, filtros: Filtros, isoField: 'fechaISO' | 'fechaEntregaISO'): boolean {
  const txt = filtros.texto.toLowerCase();
  const matchTxt =
    !filtros.texto ||
    p.cliente.toLowerCase().includes(txt) ||
    p.pedido.toLowerCase().includes(txt) ||
    p.producto.toLowerCase().includes(txt);
  const matchEst = filtros.estados.length === 0 || filtros.estados.includes(p.estado);
  const matchSup = filtros.supervisores.length === 0 || filtros.supervisores.includes(p.supervisor);
  const matchFecha =
    !filtros.fechaDesde ||
    !filtros.fechaHasta ||
    !p[isoField] ||
    (p[isoField] >= filtros.fechaDesde && p[isoField] <= filtros.fechaHasta);
  const matchLinea =
    !filtros.linea ||
    (filtros.linea === 'RESORTE'
      ? p.linea.includes('RESORTE')
      : p.linea.includes('ESPUMA') && p.producto.toUpperCase().includes('COLCHON'));
  return matchTxt && matchEst && matchSup && matchFecha && matchLinea;
}

export function filtrarPedidos(all: Pedido[], filtros: Filtros, isoField: 'fechaISO' | 'fechaEntregaISO'): Pedido[] {
  return all.filter((p) => aplicaFiltros(p, filtros, isoField));
}

export function agruparPorUbigeo(pedidos: Pedido[], campoFecha: CampoFecha = 'PEDIDOFECHA'): UbigeoGroup[] {
  const byUbigeo = new Map<string, Map<string, Map<string, Map<string, Pedido[]>>>>();

  for (const p of pedidos) {
    let ub = byUbigeo.get(p.ubigeo);
    if (!ub) {
      ub = new Map();
      byUbigeo.set(p.ubigeo, ub);
    }
    let ag = ub.get(p.agencia);
    if (!ag) {
      ag = new Map();
      ub.set(p.agencia, ag);
    }
    let cli = ag.get(p.cliente);
    if (!cli) {
      cli = new Map();
      ag.set(p.cliente, cli);
    }
    let ped = cli.get(p.pedido);
    if (!ped) {
      ped = [];
      cli.set(p.pedido, ped);
    }
    ped.push(p);
  }

  const fechaDe = (x: PedidoItems): string =>
    campoFecha === 'FECHAENTREGA' ? (x.items[0].fechaEntrega || '') : (x.items[0].fecha || '');

  const groups: UbigeoGroup[] = [];
  for (const [ubigeo, agencias] of byUbigeo) {
    const agenciaGroups: AgenciaGroup[] = [];
    for (const [agencia, clientesMap] of agencias) {
      const clienteGroups: ClienteGroup[] = [];
      for (const [cliente, pedidosMap] of clientesMap) {
        const list = Array.from(pedidosMap.entries()).map(([pedido, items]) => ({
          pedido,
          items: items.slice().sort((a, b) => a.producto.localeCompare(b.producto)),
        }));
        list.sort((a, b) => fechaDe(b).localeCompare(fechaDe(a)));
        clienteGroups.push({ cliente, agencia, pedidos: list, total: list.length });
      }
      clienteGroups.sort((a, b) => a.cliente.localeCompare(b.cliente));
      const total = clienteGroups.reduce((acc, c) => acc + c.total, 0);
      agenciaGroups.push({ agencia, clientes: clienteGroups, total });
    }
    agenciaGroups.sort((a, b) => a.agencia.localeCompare(b.agencia));
    const total = agenciaGroups.reduce((acc, a) => acc + a.total, 0);
    groups.push({ ubigeo, total, agencias: agenciaGroups });
  }

  groups.sort((a, b) => a.ubigeo.localeCompare(b.ubigeo));
  return groups;
}

export function contarPreparadosPorUbigeo(groups: UbigeoGroup[], isPrepared: (pedido: string) => boolean): Map<string, number> {
  const m = new Map<string, number>();
  for (const g of groups) {
    let count = 0;
    for (const a of g.agencias) for (const c of a.clientes) for (const p of c.pedidos) if (isPrepared(p.pedido)) count++;
    m.set(g.ubigeo, count);
  }
  return m;
}
