import { Pedido } from '../../core/models/pedido.model';
import { Filtros } from '../../core/state/filtros.service';

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

export interface UbigeoGroup {
  ubigeo: string;
  total: number;
  clientes: ClienteGroup[];
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
  return matchTxt && matchEst && matchSup && matchFecha;
}

export function filtrarPedidos(all: Pedido[], filtros: Filtros, isoField: 'fechaISO' | 'fechaEntregaISO'): Pedido[] {
  return all.filter((p) => aplicaFiltros(p, filtros, isoField));
}

export function agruparPorUbigeo(pedidos: Pedido[]): UbigeoGroup[] {
  const byUbigeo = new Map<string, Map<string, Map<string, Pedido[]>>>();

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
    let ped = ag.get(p.pedido);
    if (!ped) {
      ped = [];
      ag.set(p.pedido, ped);
    }
    ped.push(p);
  }

  const groups: UbigeoGroup[] = [];
  for (const [ubigeo, agencias] of byUbigeo) {
    const clientes = new Map<string, Map<string, Pedido[]>>();
    for (const [, pedidosByCliente] of agencias) {
      for (const [pedido, items] of pedidosByCliente) {
        const cliente = items[0].cliente;
        const agencia = items[0].agencia;
        let cli = clientes.get(cliente);
        if (!cli) {
          cli = new Map();
          clientes.set(cliente, cli);
        }
        cli.set(pedido, items);
        void agencia;
      }
    }

    const clienteGroups: ClienteGroup[] = [];
    for (const [cliente, pedidos] of clientes) {
      const agencia = pedidos.values().next().value?.[0]?.agencia ?? '';
      const list = Array.from(pedidos.entries()).map(([pedido, items]) => ({
        pedido,
        items: items.slice().sort((a, b) => a.producto.localeCompare(b.producto)),
      }));
      list.sort((a, b) => b.items[0].fecha.localeCompare(a.items[0].fecha));
      clienteGroups.push({ cliente, agencia, pedidos: list, total: list.length });
    }
    clienteGroups.sort((a, b) => a.cliente.localeCompare(b.cliente));

    const total = clienteGroups.reduce((acc, c) => acc + c.total, 0);
    groups.push({ ubigeo, total, clientes: clienteGroups });
  }

  groups.sort((a, b) => a.ubigeo.localeCompare(b.ubigeo));
  return groups;
}

export function contarPreparadosPorUbigeo(groups: UbigeoGroup[], isPrepared: (pedido: string) => boolean): Map<string, number> {
  const m = new Map<string, number>();
  for (const g of groups) {
    let count = 0;
    for (const c of g.clientes) for (const p of c.pedidos) if (isPrepared(p.pedido)) count++;
    m.set(g.ubigeo, count);
  }
  return m;
}
