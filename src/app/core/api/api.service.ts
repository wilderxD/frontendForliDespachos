import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ApiError } from './api-error';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');
  private readonly token = environment.apiToken;

  private buildUrl(action: string, params: Record<string, string | number | undefined> = {}): string {
    const url = new URL(this.baseUrl);
    url.searchParams.set('action', action);
    if (this.token) url.searchParams.set('token', this.token);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) url.searchParams.set(k, String(v));
    });
    return url.toString();
  }

  async get<T>(action: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
    return this.request<T>(this.buildUrl(action, params), { method: 'GET' });
  }

  async post<T>(action: string, body: unknown): Promise<T> {
    const init: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
    };
    return this.request<T>(this.buildUrl(action), init);
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err) {
      throw new ApiError('NETWORK', 'No se pudo conectar con la API. Verifica la conexión.');
    }

    if (!res.ok) {
      throw new ApiError('HTTP', `Error HTTP ${res.status} desde la API`);
    }

    let json: ApiResponse<T>;
    try {
      json = (await res.json()) as ApiResponse<T>;
    } catch {
      throw new ApiError('INVALID_RESPONSE', 'La API devolvió una respuesta inválida');
    }

    if (!json.ok) {
      const code = json.error?.code ?? 'UNKNOWN';
      const message = json.error?.message ?? 'Error desconocido de la API';
      throw new ApiError(code, message);
    }

    return json.data as T;
  }
}
