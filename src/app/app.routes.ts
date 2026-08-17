import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'preparar' },
  {
    path: 'preparar',
    loadComponent: () => import('./features/preparar/preparar.component').then((m) => m.PrepararComponent),
  },
  {
    path: 'despachar',
    loadComponent: () => import('./features/despachar/despachar.component').then((m) => m.DespacharComponent),
  },
  {
    path: 'historial',
    loadComponent: () => import('./features/historial/historial.component').then((m) => m.HistorialComponent),
  },
  { path: '**', redirectTo: 'preparar' },
];
