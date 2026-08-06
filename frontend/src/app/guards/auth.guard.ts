import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const hasToken = (): boolean => !!localStorage.getItem('hm_token');

export const authGuard: CanActivateFn = () => {
  if (hasToken()) return true;
  return inject(Router).parseUrl('/welcome');
};

export const guestGuard: CanActivateFn = () => {
  if (!hasToken()) return true;
  return inject(Router).parseUrl('/');
};

export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  if (!hasToken()) return router.parseUrl('/welcome');
  const user = await inject(AuthService).whenReady();
  return !!user?.is_admin ? true : router.parseUrl('/');
};
