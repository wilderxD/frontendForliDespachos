import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { GuardarResult, HistorialRecord } from '../models/despacho.model';
import { Pedido } from '../models/pedido.model';

@Injectable({ providedIn: 'root' })
export class PrintService {
  private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');
  private readonly token = environment.apiToken;

  generar(data: GuardarResult): void {
    const items = data.items;
    const pedidosUnicos = [...new Set(items.map((i) => i.pedido))];
    const totalPedidos = pedidosUnicos.length;

    const filas = items
      .map((i, idx) => {
        const orderIdx = pedidosUnicos.indexOf(i.pedido) + 1;
        const isFirstOfGroup = idx === 0 || items[idx - 1].pedido !== i.pedido;
        const cellValue = isFirstOfGroup ? orderIdx : '';
        const sepClass = isFirstOfGroup ? ' group-separator' : '';
        const rowBg = orderIdx % 2 === 0 ? ' style="background:#f2f2f2"' : '';
        return `<tr class="${sepClass}"${rowBg}>
          <td style="text-align:center;background:#fffde7" contenteditable="true">${cellValue}</td>
          <td style="white-space:nowrap">${this.esc(i.pedido)}</td>
          <td>${this.esc(i.cliente.substring(0, 30))}</td>
          <td contenteditable="true" style="background:#fffde7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this.esc(i.agencia)}</td>
          <td contenteditable="true" style="white-space:nowrap">${this.esc(i.codigoVenta || '-')}</td>
          <td contenteditable="true" style="white-space:normal;word-break:break-word">${this.esc(i.producto)}</td>
          <td contenteditable="true" style="text-align:center;font-weight:bold">${i.cantidad}</td>
          <td style="text-align:center;font-size:12px;letter-spacing:4px">☐ ☐</td>
        </tr>`;
      })
      .join('');

    let filasObs = '';
    pedidosUnicos.forEach((ped) => {
      const itemsPedido = items.filter((i) => i.pedido === ped);
      const obs = itemsPedido[0]?.observacion || '';
      if (obs.trim() !== '') {
        filasObs += `<tr>
          <td style="font-weight:bold">${this.esc(ped)}</td>
          <td>${this.esc(itemsPedido[0]?.cliente || '')}</td>
          <td>${this.esc(itemsPedido[0]?.agencia || '')}</td>
          <td>${this.esc(obs)}</td>
        </tr>`;
      }
    });
    if (filasObs === '') filasObs = "<tr><td colspan='4' style='text-align:center;padding:12px'>NO HAY OBSERVACIONES</td></tr>";

    const itemsJson = JSON.stringify(items).replace(/<\/script/gi, '<\\/script');
    const url = this.baseUrl;
    const token = this.token;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Despacho ${this.esc(data.id)}</title>
<style>
  @page { size: landscape; margin: 5mm 6mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; font-size: 9px; line-height: 1.3; color: #000; }
  .save-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; padding: 3px 8px; background: #e8f0fe; border: 1px solid #2563EB; border-radius: 3px; font-size: 10px; }
  .save-bar button { padding: 3px 10px; background: #2563EB; color: white; border: none; border-radius: 3px; cursor: pointer; font-weight: bold; font-size: 10px; }
  .save-bar button:disabled { opacity: 0.6; }
  .save-bar .save-status { margin-left: 6px; font-size: 9px; }
  .header { text-align: center; margin-bottom: 6px; border-bottom: 3px solid #000; padding: 6px; background: #f5f5f5; }
  .header h1 { margin: 0; font-size: 14px; font-weight: 800; letter-spacing: 1px; }
  .header .sub { font-size: 8px; color: #555; margin-top: 2px; }
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 9px; }
  .info-table td { border: 1px solid #000; padding: 2px 4px; font-weight: bold; white-space: nowrap; }
  table.dispatch { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 9px; table-layout: fixed; }
  table.dispatch th { background: #e0e0e0; padding: 2px 2px; border: 1px solid #000; text-align: center; text-transform: uppercase; font-weight: 700; }
  table.dispatch td { border: 1px solid #000; padding: 1px 2px; vertical-align: top; }
  table.dispatch .group-separator td { border-top: 2.5px solid #000; }
  .obs-section { margin-top: 8px; }
  .obs-section h3 { font-size: 10px; font-weight: 700; margin: 0 0 3px 0; border-bottom: 1px solid #999; padding-bottom: 2px; }
  .obs-table { width: 100%; border-collapse: collapse; font-size: 9px; }
  .obs-table th { background: #e0e0e0; padding: 2px; border: 1px solid #000; text-align: center; text-transform: uppercase; font-weight: 700; }
  .obs-table td { border: 1px solid #000; padding: 2px 4px; vertical-align: top; }
  .footer { margin-top: 48px; display: flex; justify-content: space-between; }
  .firma-block { width: 30%; }
  .firma-line { border-top: 1px solid #000; padding-top: 2px; font-size: 8px; text-align: center; }
  .firma-check { font-size: 11px; }
  @media print { .save-bar { display: none !important; } td[contenteditable="true"] { background: none !important; } tr[style*="background"] { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="save-bar">
    <span><strong>${this.esc(data.id)}</strong></span>
    <button onclick="guardarCambios()">Guardar cambios</button>
    <span class="save-status" id="saveStatus"></span>
  </div>
  <div class="header">
    <h1>FORLI — HOJA DE DESPACHO</h1>
    <div class="sub">ID: ${this.esc(data.id)} | Emitido: ${this.esc(data.fecha)}</div>
  </div>
  <table class="info-table">
    <tr>
      <td>CHOFER: ${this.esc(data.chofer)}</td>
      <td>PLACA: ${this.esc(data.placa)}</td>
      <td>PEDIDOS: ${totalPedidos}</td>
    </tr>
    <tr>
      <td>ITEMS: ${items.length}</td>
      <td colspan="2">FECHA: ${this.esc(data.fecha)}</td>
    </tr>
  </table>
  <table class="dispatch">
    <thead>
      <tr>
        <th width="3%">#</th>
        <th width="3%">PEDIDO</th>
        <th width="15%">CLIENTE</th>
        <th width="15%">AGENCIA</th>
        <th width="5%">COD</th>
        <th width="41%">PRODUCTO</th>
        <th width="4%">CNT</th>
        <th width="14%">VERIF.</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>
  <div class="footer">
    <div class="firma-block"><div class="firma-line">FIRMA SUPERVISOR <span class="firma-check">☐</span></div></div>
    <div class="firma-block"><div class="firma-line">FIRMA AYUDANTE 1 <span class="firma-check">☐</span></div></div>
    <div class="firma-block"><div class="firma-line">FIRMA AYUDANTE 2 <span class="firma-check">☐</span></div></div>
  </div>
  <div class="obs-section">
    <h3>OBSERVACIONES POR PEDIDO</h3>
    <table class="obs-table">
      <thead>
        <tr>
          <th width="10%">PEDIDO</th>
          <th width="25%">CLIENTE</th>
          <th width="25%">AGENCIA</th>
          <th width="40%">OBSERVACIONES</th>
        </tr>
      </thead>
      <tbody>${filasObs}</tbody>
    </table>
  </div>
<script>
var DESPACHO = { id: ${JSON.stringify(data.id)}, items: ${itemsJson} };
var BASE_URL = ${JSON.stringify(url)};
var TOKEN = ${JSON.stringify(token)};
function guardarCambios() {
  var filas = document.querySelectorAll('table.dispatch tbody tr');
  var items = Array.from(filas).map(function (tr) {
    var celdas = tr.querySelectorAll('td');
    return {
      pedido: celdas[1] ? celdas[1].innerText.trim() : '',
      cliente: celdas[2] ? celdas[2].innerText.trim() : '',
      agencia: celdas[3] ? celdas[3].innerText.trim() : '',
      codigoVenta: celdas[4] ? celdas[4].innerText.trim() : '',
      producto: celdas[5] ? celdas[5].innerText.trim() : '',
      cantidad: parseInt(celdas[6] ? celdas[6].innerText : '0', 10) || 0
    };
  });
  items.forEach(function (item, i) {
    var o = DESPACHO.items[i];
    if (o) {
      item.idUnico = o.idUnico;
      item.linea = o.linea;
      item.observacion = o.observacion;
      item.direccion = o.direccion;
      item.ubigeo = o.ubigeo;
      item.supervisor = o.supervisor;
      item.estado = o.estado;
      item.fecha = o.fecha;
      item.fechaISO = o.fechaISO;
      item.fechaEntrega = o.fechaEntrega;
      item.fechaEntregaISO = o.fechaEntregaISO;
    }
  });
  var btn = document.querySelector('.save-bar button');
  var statusEl = document.getElementById('saveStatus');
  btn.disabled = true;
  btn.innerText = 'Guardando…';
  statusEl.innerHTML = '';
  var url = BASE_URL + '?action=actualizar' + (TOKEN ? '&token=' + encodeURIComponent(TOKEN) : '');
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ id: DESPACHO.id, items: items })
  })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res && res.ok) {
        statusEl.innerHTML = '<span style="color:green;font-weight:bold">✓ Guardado ' + (res.data && res.data.fecha ? res.data.fecha : '') + '</span>';
      } else {
        throw new Error((res && res.error && res.error.message) || 'Error al guardar');
      }
    })
    .catch(function (err) {
      statusEl.innerHTML = '<span style="color:red;font-weight:bold">✗ Error: ' + err.message + '</span>';
    })
    .finally(function () {
      btn.disabled = false;
      btn.innerText = 'Guardar cambios';
    });
}
window.onload = function () { window.print(); };
</script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=1100,height=700');
    if (!w) return;
    w.document.write(html);
    w.document.close();
  }

  reimprimir(data: HistorialRecord): void {
    const asResult: GuardarResult = {
      id: data.id,
      fecha: data.fecha,
      chofer: data.chofer,
      placa: data.placa,
      items: data.items as Pedido[],
    };
    this.generar(asResult);
  }

  private esc(value: string): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
