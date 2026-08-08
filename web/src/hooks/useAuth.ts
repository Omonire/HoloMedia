import { useEffect, useState } from 'react';
import { authSession } from '@holomedia/shared';
import type { User } from '@holomedia/shared';

export function useAuth(): {
  user: User | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (data: {
    username: string;
    email: string;
    full_name: string;
    password: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User> & { password?: string }) => Promise<User>;
} {
  const [, force] = useState(0);
  useEffect(() => authSession.subscribe(() => force((n) => n + 1)), []);
  return {
    user: authSession.user,
    ready: authSession.ready,
    login: authSession.login.bind(authSession),
    register: authSession.register.bind(authSession),
    logout: authSession.logout.bind(authSession),
    updateProfile: authSession.updateProfile.bind(authSession),
  };
}
