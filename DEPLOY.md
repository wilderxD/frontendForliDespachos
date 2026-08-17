# Forli Despacho — Frontend Angular 21

SPA que consume la API REST de Google Apps Script (`API.gs`).

## Configuración (requerida antes de usar)

Editar `src/environments/environment.ts` (dev) y `src/environments/environment.prod.ts` (prod):

```ts
export const environment = {
  production: true,
  apiUrl: 'https://script.google.com/macros/s/<ID_DEL_DEPLOYMENT>/exec',
  apiToken: 'PEGA_AQUI_TU_TOKEN', // el mismo secreto de API.gs (API_TOKEN)
};
```

El token viaja como `?token=` en cada petición. Si dejas `apiToken` vacío, se omite
(el mismo comportamiento que `API_TOKEN = ""` en `API.gs`).

## Desarrollo

```bash
npm start        # ng serve (usa environment.ts)
```

## Build

```bash
npm run build    # ng build → dist/frontend/browser
```

`angular.json` reemplaza `environment.ts` por `environment.prod.ts` en el build de producción.

## Despliegue en Netlify

1. Subir este directorio (`frontend/`) a un repo (GitHub/GitLab/Bitbucket).
2. En Netlify: **Add new site → Import from Git**.
3. Config automática vía `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist/frontend/browser`
   - Redirect `/* → /index.html 200` (SPA fallback, también existe `public/_redirects`).
4. **Variables de entorno** (Build settings → Environment):
   - No son necesarias para el token (se compilan en el bundle vía fileReplacements).
   - Para cambiar URL/token sin tocar código, edita `environment.prod.ts` antes de pushear.
5. Deploy. El sitio queda disponible en `https://<tu-sitio>.netlify.app`.

> **Seguridad:** el token viaja en el bundle de la SPA, así que cualquier visitante
> puede verlo en DevTools. Usa un token de solo lectura para el frontend, o protege
> el sitio con autenticación de Netlify si quieres restringir acceso.

## Notas técnicas

- Angular 21 standalone + signals + `resource()` (params/loader).
- Bootstrap 5 (bundled), Bootstrap Icons, SortableJS (reordenar carrito).
- Filtrado local de los ~11K pedidos vía `computed()` (una sola llamada a `pedidos_all`).
- La expansión del árbol es perezosa por cliente: solo se renderiza el contenido expandido.
- Persistencia de sesión (preparados/carrito/en-ruta) en `sessionStorage`.