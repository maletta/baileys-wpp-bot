import { storage } from '@/lib/utils';

export function clearAuthStorage(): void {
  storage.remove('accessToken');
  storage.remove('user');
}
