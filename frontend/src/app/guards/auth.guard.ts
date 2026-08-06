import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

const hasToken = (): boolean => !!localStorage.getItem('hm_token');

export const authGuard: CanActivateFn = () => {
  if (hasToken()) return true;
  return inject(Router).parseUrl('/login');
};

export const guestGuard: CanActivateFn = () => {
  if (!hasToken()) return true;
  return inject(Router).parseUrl('/');
};
