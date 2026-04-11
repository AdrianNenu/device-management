import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'register', renderMode: RenderMode.Prerender },
  { path: 'devices', renderMode: RenderMode.Prerender },
  { path: 'devices/new', renderMode: RenderMode.Client },
  { path: 'devices/:id', renderMode: RenderMode.Client },
  { path: 'devices/:id/edit', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client }
];