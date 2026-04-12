import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // withCredentials sends the HttpOnly auth_token cookie automatically.
  // The XSRF-TOKEN cookie is read by Angular's built-in XSRF interceptor
  // and sent as X-XSRF-TOKEN header — no manual token handling needed.
  const credentialReq = req.clone({ withCredentials: true });

  return next(credentialReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) authService.logout();
      return throwError(() => error);
    })
  );
};