import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './services/auth.service';

// Fetch the CSRF token once when the app starts so Angular has it before
// making any mutating requests.
function initCsrf(auth: AuthService) {
  return () => auth.initCsrf();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor]),
      // Tell Angular where the CSRF cookie and header names are
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN'
      })
    ),
    provideAnimationsAsync(),
    {
      provide:  APP_INITIALIZER,
      useFactory: initCsrf,
      deps:     [AuthService],
      multi:    true
    }
  ]
};